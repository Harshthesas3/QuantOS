import { toastSuccess } from '../lib/toast'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Clock, Plus, Save, ArrowRight, Trash2, Edit2, Play, CheckCircle, FileText, FolderOpen, Flag } from 'lucide-react'
import { useCurriculumStore, NodeStatus } from '../stores/curriculumStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select } from '../components/ui/select'
import { ProgressBar } from '../components/ui/progress'

export default function TopicDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { nodes, updateNodeStatus, updateNodeNotes, addActualHours, toggleMasteryCriterion, addResource, removeResource, updateResourceStatus } = useCurriculumStore()
  const { addCard } = useSpacedRepetitionStore()
  const activeStudySession = useStudySessionStore((state) =>
    state.activeSessionId ? state.sessions[state.activeSessionId] ?? null : null,
  )

  const node = id ? nodes[id] : null
  const [notesText, setNotesText] = useState('')
  const [newResourceTitle, setNewResourceTitle] = useState('')
  const [newResourceUrl, setNewResourceUrl] = useState('')
  const [newResourceType, setNewResourceType] = useState('Book')
  const [flashcardPrompt, setFlashcardPrompt] = useState('')
  const [flashcardAnswer, setFlashcardAnswer] = useState('')
  const [showAddResource, setShowAddResource] = useState(false)
  const [editingHours, setEditingHours] = useState(false)
  const [editHoursValue, setEditHoursValue] = useState('')

  useEffect(() => {
    if (node) {
      setNotesText(node.notes || '')
    }
  }, [node])

  if (!node) {
    return (
      <div className="flex-1 p-8 text-center text-[#F4F1EA]">
        <h2 className="text-xl font-bold">Node not found.</h2>
        <Link to="/roadmap" className="text-[#C8BFAF] mt-4 block hover:underline">Back to Roadmap</Link>
      </div>
    )
  }

  const handleSaveNotes = () => {
    updateNodeNotes(id!, notesText)
    toastSuccess('Notes saved')
  }

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault()
    if (id && newResourceTitle) {
      addResource(id, { title: newResourceTitle, type: newResourceType, url: newResourceUrl })
      setNewResourceTitle('')
      setNewResourceUrl('')
      setShowAddResource(false)
      toastSuccess('Resource added')
    }
  }

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault()
    if (id && flashcardPrompt && flashcardAnswer) {
      addCard(id, flashcardPrompt, flashcardAnswer)
      setFlashcardPrompt('')
      setFlashcardAnswer('')
      toastSuccess('SM-2 Flashcard added successfully!')
    }
  }

  const handleStartStudySession = () => {
    if (!id) return
    navigate(`/study/${node.id}`)
  }

  const handleMarkComplete = () => {
    if (!id) return
    const next: Record<NodeStatus, NodeStatus> = {
      'LOCKED': 'UNLOCKED',
      'UNLOCKED': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'MASTERED',
      'MASTERED': 'LOCKED'
    }
    updateNodeStatus(id, next[node.status])
    toastSuccess('Status updated', `${node.title} is now ${next[node.status]}`)
  }

  const handleAddHours = () => {
    const hours = parseFloat(editHoursValue)
    if (!isNaN(hours) && hours > 0 && id) {
      addActualHours(id, hours)
      setEditingHours(false)
      toastSuccess('Hours logged', `${hours}h added to ${node.title}`)
    }
  }

  const handleDeleteResource = (resourceId: string) => {
    if (!id) return
    removeResource(id, resourceId)
    toastSuccess('Resource removed')
  }

  const parentNodes = node.prerequisites.map(pId => nodes[pId]).filter(Boolean)
  const childNodes = Object.values(nodes).filter(n => n.prerequisites.includes(node.id))
  const isTimerRunningOnThisNode = activeStudySession?.topicId === node.id && (activeStudySession.status === 'active' || activeStudySession.status === 'paused')

  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'MASTERED': return <Badge status="success" variant="solid" className="text-xs">{status}</Badge>
      case 'COMPLETED': return <Badge status="success" variant="outline" className="text-xs">{status}</Badge>
      case 'IN_PROGRESS': return <Badge status="info" variant="solid" className="text-xs">{status}</Badge>
      case 'UNLOCKED': return <Badge status="default" variant="outline" className="text-xs">{status}</Badge>
      default: return <Badge status="error" variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const progressPercent = node.estimatedHours > 0 ? Math.round((node.actualHours / node.estimatedHours) * 100) : 0
  const masteredCount = node.masteryCriteria.filter(c => c.startsWith('[x]')).length
  const masteryPercent = node.masteryCriteria.length > 0 ? Math.round((masteredCount / node.masteryCriteria.length) * 100) : 0

  const difficulty = node.estimatedHours <= 5 ? 'Beginner' : node.estimatedHours <= 15 ? 'Intermediate' : node.estimatedHours <= 30 ? 'Advanced' : 'Expert'
  const difficultyColor = difficulty === 'Beginner' ? 'text-green-400' : difficulty === 'Intermediate' ? 'text-yellow-400' : difficulty === 'Advanced' ? 'text-orange-400' : 'text-red-400'

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#F4F1EA]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#2A2E36]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/roadmap')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-[#2A2E36] text-[#C8BFAF] rounded">
                {node.id}
              </span>
              <Badge status="default" variant="outline" className="text-xs">
                {node.phaseId.replace('PHASE_', 'Phase ')}
              </Badge>
              <span className={`text-xs font-semibold ${difficultyColor}`}>{difficulty}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-white">{node.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(node.status)}
          <Button variant="secondary" size="sm" onClick={handleMarkComplete}>
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            {node.status === 'MASTERED' ? 'Unmaster' : node.status === 'COMPLETED' ? 'Master' : 'Complete'}
          </Button>
          <Button variant={isTimerRunningOnThisNode ? 'secondary' : 'primary'} size="sm" onClick={handleStartStudySession}>
            <Play className="w-3.5 h-3.5 mr-1" /> {isTimerRunningOnThisNode ? 'Open Session' : 'Start Study'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8BFAF]" /> Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#A9A39A] leading-relaxed">{node.description}</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#C8BFAF]" /> Learning Objectives
              </CardTitle>
              <Badge status="info" variant="outline" className="text-[10px]">{masteredCount}/{node.masteryCriteria.length}</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {node.masteryCriteria.map((crit, index) => {
                  const checked = crit.startsWith('[x] ')
                  const cleanCrit = crit.replace('[x] ', '')
                  return (
                    <li
                      key={index}
                      onClick={() => toggleMasteryCriterion(node.id, index)}
                      className="flex gap-3 text-sm text-[#A9A39A] cursor-pointer hover:text-[#F4F1EA] transition-colors items-start"
                    >
                      <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                        checked ? 'bg-[#C8BFAF] border-[#C8BFAF]' : 'border-[#2A2E36]'
                      }`}>
                        {checked && <CheckCircle className="w-3.5 h-3.5 fill-white" />}
                      </div>
                      <span className={checked ? 'line-through text-[#7C7870]' : 'text-white'}>{cleanCrit}</span>
                    </li>
                  )
                })}
              </ul>
              <ProgressBar value={masteryPercent} max={100} size="sm" className="mt-4" />
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C8BFAF]" /> Time Tracking
              </CardTitle>
              {!editingHours ? (
                <Button variant="ghost" size="sm" onClick={() => { setEditHoursValue(String(node.actualHours)); setEditingHours(true) }}>
                  <Edit2 className="w-3.5 h-3.5" /> Log Hours
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editHoursValue}
                    onChange={(e) => setEditHoursValue(e.target.value)}
                    className="w-20 !text-xs"
                    placeholder="Hours"
                    step="0.5"
                    min="0"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddHours}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingHours(false)}>Cancel</Button>
                </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-[#1F2229] rounded-lg">
                  <span className="text-2xl font-bold font-mono text-[#C8BFAF]">{node.actualHours.toFixed(1)}</span>
                  <span className="text-xs text-[#A9A39A] block mt-1">Actual Hours</span>
                </div>
                <div className="text-center p-3 bg-[#1F2229] rounded-lg">
                  <span className="text-2xl font-bold font-mono text-white">{node.estimatedHours}</span>
                  <span className="text-xs text-[#A9A39A] block mt-1">Estimated</span>
                </div>
                <div className="text-center p-3 bg-[#1F2229] rounded-lg">
                  <span className="text-2xl font-bold font-mono text-green-400">{progressPercent}%</span>
                  <span className="text-xs text-[#A9A39A] block mt-1">Progress</span>
                </div>
              </div>
              <ProgressBar value={progressPercent} max={100} showLabel={true} />
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C8BFAF]" /> Study Notes
              </CardTitle>
              <Button variant="primary" size="sm" onClick={handleSaveNotes}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </CardHeader>
            <CardContent>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write your notes here... LaTeX syntax is supported for mathematics (e.g. $$dS_t = \mu S_t dt + \sigma S_t dW_t$$)"
                className="w-full min-h-[200px] bg-[#0B0C10] border border-[#2A2E36] p-4 rounded-md text-sm text-[#F4F1EA] font-mono focus:outline-none focus:border-[#C8BFAF] leading-relaxed resize-y"
              />
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Create SM-2 Spaced Repetition Card</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFlashcard} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Prompt / Question"
                    value={flashcardPrompt}
                    onChange={(e) => setFlashcardPrompt(e.target.value)}
                    placeholder="e.g., What is Ito's Lemma formula?"
                  />
                  <Input
                    label="Answer / Solution"
                    value={flashcardAnswer}
                    onChange={(e) => setFlashcardAnswer(e.target.value)}
                    placeholder="e.g., dX_t = f_t dt + f_x dW_t + ..."
                  />
                </div>
                <Button type="submit" variant="secondary" className="!text-xs">
                  Add Flashcard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white">Mastery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A9A39A]">Mastery</span>
                  <span className="text-xs font-mono text-white">{masteryPercent}%</span>
                </div>
                <ProgressBar value={masteryPercent} max={100} size="md" showLabel={false} />
                <div className="flex justify-between items-center pt-2 border-t border-[#2A2E36]/50">
                  <span className="text-xs text-[#A9A39A]">Status</span>
                  {getStatusBadge(node.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A9A39A]">Prerequisites</span>
                  <span className="text-xs font-mono text-white">{node.prerequisites.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A9A39A]">Resources</span>
                  <span className="text-xs font-mono text-white">{node.resources.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#C8BFAF]" /> Curated Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {node.resources.length > 0 ? (
                node.resources.map((res) => (
                  <div key={res.id} className="p-3 bg-[#0B0C10] border border-[#2A2E36] rounded flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#2A2E36] text-[#C8BFAF] rounded uppercase">
                          {res.type}
                        </span>
                        <Badge status={res.status === 'Completed' ? 'success' : 'default'} variant="outline" className="text-[9px]">
                          {res.status}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{res.title}</h4>
                      {res.url && (
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C8BFAF] hover:underline block mt-0.5">
                          {res.url}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Button
                        variant={res.status === 'Completed' ? 'info' : 'secondary'}
                        size="sm"
                        className="!p-1"
                        onClick={() => updateResourceStatus(node.id, res.id, res.status === 'Completed' ? 'Not Started' : 'Completed')}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1 text-red-400 hover:text-red-500"
                        onClick={() => handleDeleteResource(res.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#A9A39A] py-4 text-center">No resources added yet.</div>
              )}
              {showAddResource ? (
                <form onSubmit={handleAddResource} className="space-y-2 pt-2 border-t border-[#2A2E36]/50">
                  <Select value={newResourceType} onChange={(e) => setNewResourceType(e.target.value)}>
                    <option value="Book">Book</option>
                    <option value="Video">Video</option>
                    <option value="Article">Article</option>
                    <option value="Paper">Paper</option>
                    <option value="Code">Code</option>
                  </Select>
                  <Input
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    placeholder="Resource title..."
                  />
                  <Input
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="URL (optional)"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="secondary" className="flex-1">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddResource(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Button variant="ghost" size="sm" className="w-full !text-xs" onClick={() => setShowAddResource(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Resource
                </Button>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white">Structure Relations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parentNodes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#A9A39A] uppercase tracking-wider font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Prerequisites
                  </span>
                  <div className="space-y-1">
                    {parentNodes.map((parent) => (
                      <Link
                        key={parent.id}
                        to={`/topic/${parent.id}`}
                        className="flex items-center gap-2 text-xs text-[#C8BFAF] hover:underline py-1"
                      >
                        <Badge status={parent.status === 'COMPLETED' || parent.status === 'MASTERED' ? 'success' : 'default'} variant="outline" className="text-[9px]">
                          {parent.status}
                        </Badge>
                        {parent.id}: {parent.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {childNodes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#A9A39A] uppercase tracking-wider font-bold flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Unlocks Next
                  </span>
                  <div className="space-y-1">
                    {childNodes.map((child) => (
                      <Link
                        key={child.id}
                        to={`/topic/${child.id}`}
                        className="flex items-center gap-2 text-xs text-[#C8BFAF] hover:underline py-1"
                      >
                        <Badge status={child.status === 'COMPLETED' || child.status === 'MASTERED' ? 'success' : child.status === 'LOCKED' ? 'error' : 'default'} variant="outline" className="text-[9px]">
                          {child.status}
                        </Badge>
                        {child.id}: {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {parentNodes.length === 0 && childNodes.length === 0 && (
                <div className="text-xs text-[#A9A39A] py-4 text-center">No dependencies</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}