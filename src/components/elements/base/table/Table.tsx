import React, { type FC } from "react";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
}

const Table: FC<TableProps> = ({
  className: classes = "",
  children,
  ...props
}) => {
  return (
    <table className={`w-full overflow-auto ${classes}`} {...props}>
      {children}
    </table>
  );
};

export default Table;
