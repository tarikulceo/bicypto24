// ./http/auth/queries.ts
import { createError } from "@b/utils/error";
import { hashPassword, validatePassword } from "@b/utils/passwords";
import { models } from "@b/db";
import {
  createSession,
  generateAccessToken,
  generateCsrfToken,
  generateEmailToken,
  generateRefreshToken,
  generateTokens,
  verifyResetToken,
} from "@b/utils/token";
import passwordGenerator from "generate-password";
import {
  isValidEip191Signature,
  isValidEip1271Signature,
} from "@walletconnect/utils";
import { emailQueue } from "@b/utils/emails";

export const userRegisterResponseSchema = {
  message: {
    type: "string",
    description: "Success message",
  },
  cookies: {
    type: "object",
    properties: {
      accessToken: {
        type: "string",
        description: "Access token",
      },
      sessionId: {
        type: "string",
        description: "Session ID",
      },
      csrfToken: {
        type: "string",
        description: "CSRF token",
      },
    },
  },
};

export const userRegisterSchema = {
  type: "object",
  properties: {
    token: {
      type: "string",
      description: "Google OAuth token",
    },
    ref: {
      type: "string",
      description: "Referral code",
    },
  },
  required: ["token"],
};

export const returnUserWithTokens = async ({ user, message }) => {
  // Prepare user data for token generation, excluding sensitive information
  const publicUser = {
    id: user.id,
    role: user.roleId,
  };

  // Generate tokens and CSRF token
  const { accessToken, refreshToken, csrfToken, sessionId } =
    await generateTokens(publicUser);
  await createSession(
    publicUser.id,
    publicUser.role,
    accessToken,
    csrfToken,
    refreshToken
  );

  return {
    message,
    cookies: {
      accessToken: accessToken,
      sessionId: sessionId,
      csrfToken: csrfToken,
    },
  };
};

export const userInclude = {
  include: [
    {
      model: models.role,
      as: "role",
      attributes: ["id", "name"],
      include: [
        {
          model: models.rolePermission,
          as: "rolePermissions",
          include: [
            {
              model: models.permission,
              as: "permission",
            },
          ],
        },
      ],
    },
    {
      model: models.twoFactor,
      attributes: ["type", "enabled"],
    },
    {
      model: models.kyc,
      attributes: ["status", "level"],
    },
    {
      model: models.author,
      attributes: ["status"],
    },
  ],
};

// send email verification token
export const sendEmailVerificationToken = async (
  userId: string,
  email: string
) => {
  const user = await models.user.findOne({
    where: { email, id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = await generateEmailToken({
    user: {
      id: user.id,
    },
  });

  try {
    await emailQueue.add({
      emailData: {
        TO: user.email,
        FIRSTNAME: user.firstName,
        CREATED_AT: user.createdAt,
        TOKEN: token,
      },
      emailType: "EmailVerification",
    });

    return {
      message: "Email with verification code sent successfully",
    };
  } catch (error) {
    throw createError({
      message: error.message,
      statusCode: 500,
    });
  }
};

// verify email token
export const verifyResetTokenQuery = async (token: string) => {
  const decodedToken = await verifyResetToken(token);

  if (!decodedToken) {
    throw new Error("Invalid token");
  }

  if (
    decodedToken.jti !== (await addOneTimeToken(decodedToken.jti, new Date()))
  ) {
    throw createError({
      statusCode: 500,
      message: "Server error",
    });
  }

  try {
    await models.user.update(
      {
        emailVerified: true,
      },
      {
        where: {
          id: decodedToken.sub.id,
        },
      }
    );

    return {
      message: "Token verified successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Server error",
    });
  }
};

// Get user by wallet address
type UserWithoutPassword = Omit<User, "password">;
export const getUserByWalletAddress = async (
  walletAddress: string
): Promise<UserWithoutPassword | null> => {
  const user = (await models.user.findOne({
    where: { walletAddress: walletAddress },
    include: userInclude,
  })) as unknown as User | null;

  if (user) {
    // Destructure to exclude the password and return the rest of the user object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
}

export async function getOrCreateUserRole() {
  // Implementation for role retrieval/creation
  await models.role.upsert({
    name: "User",
  });

  return await models.role.findOne({
    where: {
      name: "User",
    },
  });
}

export async function createUser(userData) {
  // Implementation for creating a new user
  return await models.user.create({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.hashedPassword,
    emailVerified: true,
    roleId: userData.role.id,
  });
}

export async function updateUser(userId, updateData) {
  // Implementation for updating an existing user
  await models.user.update(
    {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      password: updateData.hashedPassword,
      emailVerified: true,
    },
    {
      where: { id: userId },
    }
  );
}

export async function createSessionAndReturnResponse(user) {
  // Implementation for creating session, generating tokens, and returning response
  const publicUser = {
    id: user.id,
    role: user.roleId,
  };
  const accessToken = await generateAccessToken(publicUser);
  const refreshToken = await generateRefreshToken(publicUser);
  const csrfToken = generateCsrfToken();

  const session = await createSession(
    user.id,
    user.roleId,
    accessToken,
    csrfToken,
    refreshToken
  );

  return {
    message: "You have been logged in successfully",
    cookies: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      sessionId: session.sid,
      csrfToken: csrfToken,
    },
  };
}

export async function generateNewPassword(id: string): Promise<Error | string> {
  // Generate secure password consistent with password policy
  const password = passwordGenerator.generate({
    length: 20,
    numbers: true,
    symbols: true,
    strict: true,
  });

  // Check if password passes password policy
  const isValidPassword = validatePassword(password);
  if (!isValidPassword) {
    return createError({
      statusCode: 500,
      message: "Server error",
    });
  }

  // Hash password
  const errorOrHashedPassword = await hashPassword(password);

  const hashedPassword = errorOrHashedPassword as string;

  try {
    await models.user.update(
      {
        password: hashedPassword,
      },
      {
        where: {
          id,
        },
      }
    );
    return password;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Server error",
    });
  }
}

export async function addOneTimeToken(
  tokenId: string,
  expiresAt: Date
): Promise<Error | string> {
  try {
    await models.oneTimeToken.create({
      tokenId: tokenId,
      expiresAt: expiresAt,
    });

    return tokenId;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Server error",
    });
  }
}

export const verifyRecaptcha = async (token) => {
  const secretKey = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY;
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    }
  );

  const data = await response.json();
  return data.success;
};

const ETH_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/u;
const ETH_CHAIN_ID_IN_SIWE_PATTERN = /Chain ID: (?<temp1>\d+)/u;
export function getAddressFromMessage(message) {
  return message.match(ETH_ADDRESS_PATTERN)?.[0] || "";
}
export function getChainIdFromMessage(message) {
  return `eip155:${message.match(ETH_CHAIN_ID_IN_SIWE_PATTERN)?.[1] || 1}`;
}
export async function verifySignature({
  address,
  message,
  signature,
  chainId,
  projectId,
}) {
  let isValid = isValidEip191Signature(address, message, signature);
  if (!isValid) {
    isValid = await isValidEip1271Signature(
      address,
      message,
      signature,
      chainId,
      projectId
    );
  }
  return isValid;
}
