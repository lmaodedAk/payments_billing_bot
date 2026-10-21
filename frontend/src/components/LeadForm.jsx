// components/LeadForm.jsx
import { useState } from 'react';
import { UserPlus, Building, Mail, Phone, CheckCircle2 } from 'lucide-react';

export default function LeadForm({ onSubmitLead }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    const leadPrompt = `Please create a new lead in Zoho CRM with the following details:
- Full Name: ${formData.name.trim()}
- Email: ${formData.email.trim()}
- Company: ${formData.company.trim() || 'Not specified'}
- Phone: ${formData.phone.trim() || 'Not specified'}
- Requirements: ${formData.notes.trim() || 'General inquiry'}`;

    onSubmitLead(leadPrompt);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', phone: '', notes: '' });
    }, 3000);
  }

  return (
    <section id="crm-leads" className="max-content px-4 sm:px-6 pb-20">
      <div className="bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50 dark:from-neutral-800/90 dark:via-[#0b0f19] dark:to-neutral-900 border border-blue-200/80 dark:border-neutral-700 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Zoho CRM Lead Generation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
            Add New Lead to Zoho CRM
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Enter prospective client details below. Our Zia Agent will immediately process the information and create a new lead record in Zoho CRM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="lead-name" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <input
                  id="lead-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                />
                <UserPlus size={16} className="absolute left-3 top-3 text-neutral-400" aria-hidden="true" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="lead-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Work Email *
              </label>
              <div className="relative">
                <input
                  id="lead-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. sarah@acme.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                />
                <Mail size={16} className="absolute left-3 top-3 text-neutral-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company */}
            <div>
              <label htmlFor="lead-company" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <input
                  id="lead-company"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                />
                <Building size={16} className="absolute left-3 top-3 text-neutral-400" aria-hidden="true" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="lead-phone" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  id="lead-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                />
                <Phone size={16} className="absolute left-3 top-3 text-neutral-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Inquiry / Requirements */}
          <div>
            <label htmlFor="lead-notes" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Requirements / Project Scope
            </label>
            <div className="relative">
              <textarea
                id="lead-notes"
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Interested in enterprise billing sync and CRM automation"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitted}
            className="btn-primary w-full py-3 mt-1 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            {submitted ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-300" aria-hidden="true" />
                <span>Sending Lead to Zoho CRM...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} aria-hidden="true" />
                <span>Create Lead in Zoho CRM via Agent</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
