import { Icon } from "@iconify/react";
import ReactDOM from "react-dom";
import { MashImage } from "./MashImage";

const ImagePortal = ({ src, onClose }) => {
  if (!src) return null;

  const portalRoot = document.getElementById("portal-root");

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div
        className="rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <MashImage
          src={src}
          alt="Preview"
          className="rounded-lg max-h-[80vh] max-w-[80vw] object-contain"
        />
        <button onClick={onClose} className="absolute top-3 right-3 text-white">
          <Icon icon="eva:close-fill" className="text-2xl" />
        </button>
      </div>
    </div>,
    portalRoot || document.body
  );
};

export default ImagePortal;
