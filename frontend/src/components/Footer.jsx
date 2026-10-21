// components/Footer.jsx

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b0f19] py-8 transition-colors">
      <div className="max-content px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <p>© {currentYear} Payment &amp; Billing Assistant. All rights reserved.</p>
        <p>Responses are powered by Zoho Zia. Verify critical transaction details with your account team.</p>
      </div>
    </footer>
  );
}
