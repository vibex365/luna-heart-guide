import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { RotateCw, Sparkles, Heart, Smile, Zap, Gift } from "lucide-react";
import { defaultWheelSegments, WheelCategory, WheelSegment } from "@/data/couplesGamesContent";

interface SpinTheWheelProps {
  partnerLinkId: string;
}

const categoryIcons: Record<WheelCategory, React.ReactNode> = {
  romantic: <Heart className="h-4 w-4" />,
  playful: <Smile className="h-4 w-4" />,
  dares: <Zap className="h-4 w-4" />,
  rewards: <Gift className="h-4 w-4" />,
};

const SpinTheWheel: React.FC<SpinTheWheelProps> = ({ partnerLinkId }) => {
  const [selectedCategory, setSelectedCategory] = useState<WheelCategory>("romantic");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);

  const segments = defaultWheelSegments[selectedCategory];
  const segmentAngle = 360 / segments.length;

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Random spins (3-5 full rotations) + random final position
    const spins = 3 + Math.random() * 2;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + randomAngle;
    
    setRotation(totalRotation);

    // Calculate result after spin
    setTimeout(() => {
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const segmentIndex = Math.floor(normalizedAngle / segmentAngle);
      const selectedSegment = segments[segmentIndex % segments.length];
      
      setResult(selectedSegment);
      setShowResult(true);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RotateCw className="h-5 w-5 text-primary" />
          Spin the Wheel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(defaultWheelSegments) as WheelCategory[]).map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer capitalize flex items-center gap-1"
              onClick={() => !isSpinning && setSelectedCategory(cat)}
            >
              {categoryIcons[cat]}
              {cat}
            </Badge>
          ))}
        </div>

        {/* Wheel */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
          </div>

          {/* Wheel Container */}
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden shadow-xl"
            style={{ 
              rotate: rotation,
              transition: isSpinning ? "all 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none"
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {segments.map((segment, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = (index + 1) * segmentAngle;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);
                
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const midAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                const textX = 50 + 32 * Math.cos(midAngle);
                const textY = 50 + 32 * Math.sin(midAngle);
                const textRotation = startAngle + segmentAngle / 2;

                return (
                  <g key={segment.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="3"
                      fontWeight="bold"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                    >
                      {segment.label.length > 15 
                        ? segment.label.substring(0, 12) + "..." 
                        : segment.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="50" cy="50" r="8" fill="white" stroke="hsl(var(--primary))" strokeWidth="2" />
            </svg>
          </motion.div>
        </div>

        {/* Spin Button */}
        <Button 
          onClick={spinWheel} 
          disabled={isSpinning}
          className="w-full"
          size="lg"
        >
          {isSpinning ? (
            <>
              <RotateCw className="h-5 w-5 mr-2 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Spin the Wheel!
            </>
          )}
        </Button>

        {/* Result */}
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center p-4 rounded-xl border-2 border-primary/30 bg-primary/5"
          >
            <p className="text-xs text-muted-foreground mb-1">You landed on:</p>
            <p className="text-lg font-bold text-primary">{result.label}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Time to do it! 😊
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpinTheWheel;
