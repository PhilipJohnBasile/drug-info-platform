'use client'

import { useState } from 'react'
import { Stethoscope, BookOpen, Pill, Brain, Loader2 } from 'lucide-react'

interface ProviderExplanation {
  explanation: string
  keyPoints: string[]
  clinicalContext: string
  practiceConsiderations: string[]
  relatedInformation?: string[]
}

export default function ProviderExplanationsPage() {
  const [explanation, setExplanation] = useState<ProviderExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [backgroundMode, setBackgroundMode] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    type: 'medical_condition' as 'medical_condition' | 'drug_mechanism' | 'treatment_approach' | 'pharmacology',
    drugName: '',
    indication: '',
    targetAudience: 'primary_care' as 'primary_care' | 'specialist' | 'pharmacy' | 'general_healthcare'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim()) return

    setLoading(true)
    setError('')
    setExplanation(null)
    setProgress(0)
    setProgressMessage('Initializing AI generation...')

    // Progress simulation for better UX during slow AI generation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10
        if (newProgress < 85) return newProgress
        return prev
      })
    }, 2000)

    // Update progress messages
    setTimeout(() => setProgressMessage('Connecting to HuggingFace AI...'), 2000)
    
    // Show background option after 10 seconds if still loading
    setTimeout(() => {
      if (loading) {
        setProgressMessage('Loading AI model (this may take 1-2 minutes)...')
        // Offer background mode after 15 seconds
        setTimeout(() => {
          if (loading && !backgroundMode) {
            setProgressMessage('This is taking longer than usual. You can continue in background mode.')
          }
        }, 5000)
      }
    }, 8000)
    
    setTimeout(() => setProgressMessage('Generating professional medical content...'), 20000)
    setTimeout(() => setProgressMessage('Finalizing explanation and formatting...'), 60000)

    try {
      const response = await fetch('http://localhost:3001/ai-service/generate-provider-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          type: formData.type,
          drugName: formData.drugName || undefined,
          indication: formData.indication || undefined,
          targetAudience: formData.targetAudience,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Complete progress
      setProgress(100)
      setProgressMessage('Complete! AI explanation generated successfully.')
      clearInterval(progressInterval)
      
      setTimeout(() => {
        setExplanation(data)
      }, 500)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to generate explanation')
      clearInterval(progressInterval)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
        setProgressMessage('')
      }, 1000)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical_condition':
        return <Stethoscope className="w-5 h-5" />
      case 'drug_mechanism':
        return <Pill className="w-5 h-5" />
      case 'treatment_approach':
        return <BookOpen className="w-5 h-5" />
      case 'pharmacology':
        return <Brain className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🩺 AI Provider Explanations
          </h1>
          <p className="text-lg text-gray-600">
            Generate professional medical explanations for healthcare providers using free HuggingFace AI
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-500 text-center mb-2">Quick examples (cached for instant results):</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => {
                  const data = {
                    topic: 'Hypertension Management',
                    type: 'medical_condition' as const,
                    drugName: 'Lisinopril',
                    indication: 'blood pressure control',
                    targetAudience: 'primary_care' as const
                  };
                  setFormData(data);
                  // Trigger the form submission
                  setTimeout(() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                🩺 Hypertension Management
              </button>
              <button 
                onClick={() => {
                  const data = {
                    topic: 'ACE Inhibitor Mechanism',
                    type: 'drug_mechanism' as const,
                    drugName: 'Lisinopril',
                    indication: '',
                    targetAudience: 'pharmacy' as const
                  };
                  setFormData(data);
                  setTimeout(() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
              >
                💊 ACE Inhibitor Mechanism
              </button>
              <button 
                onClick={() => {
                  const data = {
                    topic: 'Diabetes Type 2 Management',
                    type: 'medical_condition' as const,
                    drugName: 'Metformin',
                    indication: 'glucose control',
                    targetAudience: 'primary_care' as const
                  };
                  setFormData(data);
                  setTimeout(() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
              >
                🩺 Diabetes Management
              </button>
              <span className="text-xs text-green-600 font-semibold self-center">⚡ Instant</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Hypertension Management, ACE Inhibitor Mechanism"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="medical_condition">Medical Condition</option>
                  <option value="drug_mechanism">Drug Mechanism</option>
                  <option value="treatment_approach">Treatment Approach</option>
                  <option value="pharmacology">Pharmacology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drug Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.drugName}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  placeholder="e.g., Lisinopril, Metformin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="primary_care">Primary Care</option>
                  <option value="specialist">Specialist</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="general_healthcare">General Healthcare</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indication (Optional)
              </label>
              <input
                type="text"
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                placeholder="e.g., blood pressure control, diabetes management"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.topic.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating AI Explanation...
                </>
              ) : (
                <>
                  {getTypeIcon(formData.type)}
                  Generate Provider Explanation
                </>
              )}
            </button>
          </form>

          {/* Progress Indicator */}
          {loading && (
            <div className="mt-4 p-6 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">AI Processing Progress</span>
                <span className="text-blue-600 text-sm">{Math.round(progress)}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <p className="text-blue-700 text-sm">
                  {progressMessage}
                </p>
              </div>
              
              {loading && progressMessage.includes('background mode') && (
                <button
                  onClick={() => {
                    setBackgroundMode(true)
                    setLoading(false)
                    setProgressMessage('')
                    setProgress(0)
                  }}
                  className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-600 transition-colors"
                >
                  Continue in Background ⏰
                </button>
              )}
              
              <p className="text-xs text-blue-600 mt-2">
                💡 Free AI models take 1-2 minutes due to cold start times - this proves it's real AI generation!
              </p>
            </div>
          )}

          {/* Background Mode Status */}
          {backgroundMode && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-700 font-medium">Background Processing Active</span>
              </div>
              <p className="text-yellow-600 text-sm">
                Your AI explanation for "{formData.topic}" is being generated in the background. 
                You can continue using the application - results will appear when ready.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                ⏰ Estimated completion: 30-90 seconds
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">
                <strong>Error:</strong> {error}
              </p>
              <p className="text-sm text-red-600 mt-1">
                If the error persists, try again in a few minutes. Free AI models can be temporarily unavailable.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {explanation && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                {getTypeIcon(formData.type)}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Provider Explanation: {formData.topic}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Main Explanation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Clinical Overview</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {explanation.explanation}
                </p>
              </div>

              {/* Key Points */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Clinical Points</h3>
                <ul className="space-y-2">
                  {explanation.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clinical Context */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Clinical Context</h3>
                <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">
                  {explanation.clinicalContext}
                </p>
              </div>

              {/* Practice Considerations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Practice Considerations</h3>
                <ul className="space-y-2">
                  {explanation.practiceConsiderations.map((consideration, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{consideration}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Information */}
              {explanation.relatedInformation && explanation.relatedInformation.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Related Information</h3>
                  <ul className="space-y-2">
                    {explanation.relatedInformation.map((info, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{info}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Badge */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                🤖 Generated using free HuggingFace AI • Professional medical content for healthcare providers
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}