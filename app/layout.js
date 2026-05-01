export const metadata = {
  title: 'Instagram Handoff Debugger',
  description: 'Debug Instagram iOS in-app browser handoff behavior',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f8fafc' }}>{children}</body>
    </html>
  );
}
