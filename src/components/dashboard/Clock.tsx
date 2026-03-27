'use client'
import { useState, useEffect } from 'react'

export function Clock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    // Initial set
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (!time) return <span className="animate-pulse">Loading...</span>

  return (
    <span className="font-mono text-foreground font-medium bg-muted/50 px-2 py-0.5 rounded border border-border/50 ml-2">
      {time}
    </span>
  )
}
