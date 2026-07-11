"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, Volume2, Music } from "lucide-react"

type Track = {
  title: string
  artist: string
  src: string
}

// Royalty-free, legally reusable tracks. SoundHelix songs are algorithmically
// generated and free to use for playback/demos.
const TRACKS: Track[] = [
  { title: "Song 1", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "Song 2", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "Song 3", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { title: "Song 4", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { title: "Song 5", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
]

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function MusicTab() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([70])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)

  const currentTrack = TRACKS[currentIndex]

  // Keep the audio element volume in sync with the slider.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  // When the selected track changes, load it and honor the current play state.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setCurrentTime(0)
    if (isPlaying) {
      audio.play().catch((err) => console.error("[v0] audio play error:", err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("[v0] audio play error:", err))
    }
  }

  const playIndex = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }

  const next = () => setCurrentIndex((i) => (i + 1) % TRACKS.length)
  const prev = () => setCurrentIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length)

  const handleSeek = (value: number[]) => {
    setIsSeeking(true)
    setCurrentTime(value[0])
  }

  const commitSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
    }
    setCurrentTime(value[0])
    setIsSeeking(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Music className="h-5 w-5 mr-2" />
          Music Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <audio
          ref={audioRef}
          src={currentTrack.src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            if (!isSeeking) setCurrentTime(e.currentTarget.currentTime)
          }}
          onEnded={next}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Now Playing */}
        <div className="text-center">
          <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Music className={`h-12 w-12 text-muted-foreground ${isPlaying ? "animate-pulse" : ""}`} />
          </div>
          <h3 className="font-medium">{currentTrack.title}</h3>
          <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous track">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={next} aria-label="Next track">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            onValueCommit={commitSeek}
            max={duration || 100}
            step={1}
            className="w-full"
            aria-label="Seek"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" aria-label="Volume" />
          <span className="text-sm text-muted-foreground w-8">{volume[0]}%</span>
        </div>

        {/* Track List */}
        <div className="space-y-2">
          <h4 className="font-medium">Tracks</h4>
          <p className="text-xs text-muted-foreground">Royalty-free music courtesy of SoundHelix</p>
          <div className="space-y-1">
            {TRACKS.map((track, index) => {
              const isActive = index === currentIndex
              return (
                <div
                  key={track.src}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => playIndex(index)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{track.title}</span>
                    <span className="text-xs text-muted-foreground">{track.artist}</span>
                  </div>
                  <Button variant="ghost" size="sm" aria-label={`Play ${track.title}`}>
                    {isActive && isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
