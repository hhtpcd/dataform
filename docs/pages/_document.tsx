import { Alignment, Button, Navbar, NavbarGroup, NavbarHeading } from "@blueprintjs/core";
import Document, { Head, Main, NextScript } from "next/document";
import * as React from "react";

import faviconImage from "df/static/images/new_logo.png";

export default class DefaultDocument extends Document {
  public render() {
    return (
      <html>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link
            rel="stylesheet"
            href="https://unpkg.com/@blueprintjs/core@2.3.1/lib/css/blueprint.css"
          />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
          />
          <link rel="shortcut icon" href={faviconImage} type="image/png" />
          <link
            href="https://fonts.googleapis.com/css?family=Montserrat|Open+Sans|Muli"
            rel="stylesheet"
          />
          <script type="text/javascript" src="/static/js/inline.js" />
        </Head>
        <body>
          <div>
            <Main />
            <NextScript />
          </div>
        </body>
      </html>
    );
  }
}
