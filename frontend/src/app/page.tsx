import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Database, Zap, Shield, Stethoscope } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Drug Information Platform - Comprehensive Medication Guide',
  description: 'Access comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations. Search thousands of medications with detailed safety information.',
  openGraph: {
    title: 'Drug Information Platform - Comprehensive Medication Guide',
    description: 'Access comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/medical-hero/1920/1080"
            alt="Medical background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 to-primary-800/90"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Comprehensive Drug Information
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              AI-enhanced medication guides with FDA label data and patient-friendly explanations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/drugs" 
                className="btn-primary text-lg px-8 py-3"
              >
                Browse Medications
              </Link>
              <Link 
                href="/search" 
                className="btn-secondary text-lg px-8 py-3 bg-white text-primary-600 hover:bg-primary-50"
              >
                Search Drugs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Get accurate, up-to-date drug information powered by AI and validated by FDA data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src="https://picsum.photos/seed/search/200/120"
                  alt="Smart search feature"
                  className="w-32 h-20 object-cover rounded-lg mx-auto mb-2 opacity-80"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-secondary-600">
                Find medications quickly by name, brand, or generic. Our intelligent search helps you discover the right information.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src="https://picsum.photos/seed/fda-data/200/120"
                  alt="FDA data feature"
                  className="w-32 h-20 object-cover rounded-lg mx-auto mb-2 opacity-80"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">FDA Data</h3>
              <p className="text-secondary-600">
                Access official FDA label information including indications, contraindications, warnings, and dosage guidelines.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src="https://picsum.photos/seed/ai-enhanced/200/120"
                  alt="AI-enhanced feature"
                  className="w-32 h-20 object-cover rounded-lg mx-auto mb-2 opacity-80"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Enhanced</h3>
              <p className="text-secondary-600">
                Get patient-friendly explanations and comprehensive FAQs generated by advanced AI for better understanding.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src="https://picsum.photos/seed/safety-first/200/120"
                  alt="Safety first feature"
                  className="w-32 h-20 object-cover rounded-lg mx-auto mb-2 opacity-80"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Safety First</h3>
              <p className="text-secondary-600">
                Detailed safety information, drug interactions, and important warnings to help you make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              🩺 For Healthcare Providers
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Generate professional medical explanations using free AI. Get clinical context, mechanism of action details, 
              and practice considerations tailored for healthcare professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/provider-explanations" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                🤖 Try AI Provider Explanations
              </Link>
              <div className="text-blue-200 text-sm flex items-center justify-center">
                ✨ Free • No API costs • Real AI generation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Start Exploring Drug Information
            </h2>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              Access thousands of medications with comprehensive information to help you make informed healthcare decisions.
            </p>
            <Link 
              href="/drugs" 
              className="btn-primary text-lg px-8 py-3 mr-4"
            >
              Browse All Drugs
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-warning-50 border-t border-warning-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="alert-warning">
            <p className="text-center font-medium">
              <strong>Important:</strong> This information is for educational purposes only and should not replace professional medical advice. 
              Always consult with a healthcare provider before making decisions about medications.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}