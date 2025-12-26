import Document, { Html, Head, Main, NextScript } from 'next/document';

// Custom document for Pages Router - uses class component pattern
class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
