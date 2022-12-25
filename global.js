console.log(Rimax);
const { define, html, useProps, useEvent, useState,Children, createDom } = Rimax;

const option = {
  defaultProps: {},
  shadowRoot: null,
};

define(
  "g-alert",
  ({ children, color, ...props }) => {
    return html`
      <div class="alert alert-${color} ${props["bts-class"]}" role="alert">
        ${children}
      </div>
    `;
  },
  {
    defaultProps: {
      color: "primary",
    },
  }
);

