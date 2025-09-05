'use client'

import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-blue-100 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="px-8 py-12 prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us.
              </p>
              
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Account Information</h3>
              <ul className="list-disc ml-6 mb-4 text-slate-700">
                <li>Name and email address</li>
                <li>Password (encrypted and hashed)</li>
                <li>Organization details and membership information</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3">Time Tracking Data</h3>
              <ul className="list-disc ml-6 mb-4 text-slate-700">
                <li>Clock in and clock out times</li>
                <li>Project assignments and descriptions</li>
                <li>Work location and shift information</li>
                <li>Time entry modifications and audit trails</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 mb-3">Usage Information</h3>
              <ul className="list-disc ml-6 text-slate-700">
                <li>Device and browser information</li>
                <li>IP address and general location</li>
                <li>App usage patterns and feature interactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc ml-6 text-slate-700">
                <li>Provide, maintain, and improve our time tracking services</li>
                <li>Process and manage your time entries and timesheets</li>
                <li>Generate reports and analytics for your organization</li>
                <li>Communicate with you about your account and service updates</li>
                <li>Ensure security and prevent fraudulent activity</li>
                <li>Comply with legal obligations and resolve disputes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Information Sharing</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc ml-6 text-slate-700">
                <li><strong>Within Your Organization:</strong> Time tracking data is shared with organization administrators and as necessary for business operations</li>
                <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist in operating our service</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc ml-6 text-slate-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Monitoring for unauthorized access attempts</li>
                <li>Secure data centers and infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
              <p className="text-slate-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. 
                When you delete your account, we will delete your personal information, except where we are required to retain it for legal, 
                regulatory, or legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc ml-6 text-slate-700">
                <li><strong>Access:</strong> Request copies of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your information to another service</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-slate-700 leading-relaxed">
                We use cookies and similar technologies to provide and improve our services. Cookies help us authenticate users, 
                remember preferences, and analyze usage patterns. You can control cookies through your browser settings, 
                though this may affect the functionality of our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. International Data Transfers</h2>
              <p className="text-slate-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate 
                safeguards are in place to protect your information in accordance with this privacy policy and applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-slate-700 leading-relaxed">
                Our service is not intended for children under the age of 16. We do not knowingly collect personal information 
                from children under 16. If we learn that we have collected such information, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-slate-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting 
                the new privacy policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this 
                policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <p className="text-slate-700"><strong>Email:</strong> privacy@clockinout.app</p>
                <p className="text-slate-700"><strong>Subject:</strong> Privacy Policy Inquiry</p>
              </div>
            </section>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}