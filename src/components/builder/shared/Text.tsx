import React, { useEffect, useState } from "react";

import { useNode, useEditor } from "@craftjs/core";

interface TextProps {
  id: string;
  className: string;
  key: string;
  text: string;
}
interface TextInterface extends React.FC<TextProps> {
  craft: object;
}

const Text: TextInterface = (props) => {
  const { node, connectors, actions } = useNode((node) => ({ node }));
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [textEdit, setTextEdit] = useState(
    node.data.props[props.id]?.text ?? props.text
  );
  const [textPreview, setTextPreview] = useState(textEdit);

  const onChange = (e: any) => {
    actions.setProp((prop: any) => {
      if (!prop[props.id]) prop[props.id] = {};
      prop[props.id].text = e.target.innerText;
      setTextPreview(e.target.innerText);
    }, 500);
  };
  const onClick = (e: any) => {
    if (enabled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    setTextEdit(node.data.props[props.id]?.text ?? props.text);
  }, [enabled]);

  return enabled ? (
    <span
      ref={(ref) => connectors.connect(ref as HTMLElement)}
      contentEditable
      suppressContentEditableWarning={true}
      className={props.className}
      onClick={onClick}
      onInput={onChange}
    >
      {textEdit}
    </span>
  ) : (
    <span className={props.className}>{textPreview}</span>
  );
};

export { Text };

Text.craft = {
  displayName: "Text",
  props: {
    text: "",
  },
  related: {},
};
