export const metadata = {
  title: 'Instagram Browser Handoff Debug',
  description: 'Debug suite for Instagram in-app browser handoff to external browser',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f8fafc' }}>{children}</body>
    </html>
  );
}
