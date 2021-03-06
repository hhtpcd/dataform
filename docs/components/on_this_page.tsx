import { Menu, MenuItem } from "@blueprintjs/core";
import * as React from "react";

interface OnThisPageItem {
  id: string;
  text: string;
}
export interface Props {
  menu: OnThisPageItem[];
}

export default class OnThisPage extends React.Component<Props, any> {
  public render() {
    const { menu } = this.props;

    if (!menu.length) {
      return null;
    }

    return (
      <div style={styles.container}>
        <h4>On this page</h4>
        <Menu style={styles.menu}>
          {menu.map(item => (
            <MenuItem href={`#${item.id}`} text={item.text} key={item.id} />
          ))}
        </Menu>
      </div>
    );
  }
}

export const styles: { [className: string]: React.CSSProperties } = {
  container: {
    paddingTop: "10px"
  },
  menu: {
    backgroundColor: "transparent",
    fontSize: "14px",
    color: "#2f2d44"
  }
};
