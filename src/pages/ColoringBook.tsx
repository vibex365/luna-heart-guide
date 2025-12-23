import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, RotateCcw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Color palette for coloring
const colors = [
  '#FF6B6B', '#FF8E72', '#FFD93D', '#6BCB77', '#4D96FF', 
  '#9B59B6', '#E91E63', '#00BCD4', '#FF5722', '#8BC34A',
  '#FFC0CB', '#FFFFFF', '#000000', '#808080', '#F5DEB3'
];

// SVG coloring pages with paths
const coloringPages = [
  {
    id: 'heart-mandala',
    title: 'Heart Mandala',
    viewBox: '0 0 200 200',
    paths: [
      { id: 'bg', d: 'M0 0h200v200H0z', defaultColor: '#FFF5F5' },
      { id: 'heart-outer', d: 'M100 40c-20-30-60-30-70 10-15 55 70 100 70 100s85-45 70-100c-10-40-50-40-70-10z', defaultColor: '#FFE4E6' },
      { id: 'heart-inner', d: 'M100 60c-12-18-36-18-42 6-9 33 42 60 42 60s51-27 42-60c-6-24-30-24-42-6z', defaultColor: '#FEC8D8' },
      { id: 'heart-center', d: 'M100 80c-8-12-24-12-28 4-6 22 28 40 28 40s34-18 28-40c-4-16-20-16-28-4z', defaultColor: '#FF9AA2' },
      { id: 'circle1', d: 'M100 130a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', defaultColor: '#FFB7B2' },
      { id: 'petal1', d: 'M60 160c-10-5-20 5-15 15s20 10 25 0-5-12-10-15z', defaultColor: '#FFDAC1' },
      { id: 'petal2', d: 'M140 160c10-5 20 5 15 15s-20 10-25 0 5-12 10-15z', defaultColor: '#FFDAC1' },
      { id: 'petal3', d: 'M100 175c0-10-10-15-15-10s-5 15 5 20 10-5 10-10z', defaultColor: '#E2F0CB' },
    ]
  },
  {
    id: 'couple-silhouette',
    title: 'Dancing Couple',
    viewBox: '0 0 200 200',
    paths: [
      { id: 'bg', d: 'M0 0h200v200H0z', defaultColor: '#F0F4FF' },
      { id: 'moon', d: 'M160 50a30 30 0 1 1-20-10 25 25 0 1 0 20 10z', defaultColor: '#FFE4B5' },
      { id: 'star1', d: 'M40 30l2 6 6 1-5 4 1 6-4-3-5 3 2-6-4-4 6-1z', defaultColor: '#FFD700' },
      { id: 'star2', d: 'M170 80l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z', defaultColor: '#FFD700' },
      { id: 'star3', d: 'M30 100l1 3 3 1-2 2 1 3-3-2-3 2 1-3-2-2 3-1z', defaultColor: '#FFD700' },
      { id: 'ground', d: 'M0 170c50-10 100 10 150 0s50-5 50 0v30H0z', defaultColor: '#E8D4E8' },
      { id: 'person1-body', d: 'M80 100c0 0-15 20-10 50l-10 30h15l5-25 10-20 10 20 5 25h15l-10-30c5-30-10-50-10-50z', defaultColor: '#FFB6C1' },
      { id: 'person1-head', d: 'M90 85a12 12 0 1 0 0-24 12 12 0 0 0 0 24z', defaultColor: '#FFDAB9' },
      { id: 'person2-body', d: 'M120 100c0 0 15 20 10 50l10 30h-15l-5-25-10-20-10 20-5 25H80l10-30c-5-30 10-50 10-50z', defaultColor: '#B0C4DE' },
      { id: 'person2-head', d: 'M110 85a12 12 0 1 0 0-24 12 12 0 0 0 0 24z', defaultColor: '#FFDAB9' },
      { id: 'heart', d: 'M100 50c-5-8-15-8-18 3-4 14 18 25 18 25s22-11 18-25c-3-11-13-11-18-3z', defaultColor: '#FF69B4' },
    ]
  },
  {
    id: 'flowers',
    title: 'Flower Bouquet',
    viewBox: '0 0 200 200',
    paths: [
      { id: 'bg', d: 'M0 0h200v200H0z', defaultColor: '#FFFAF0' },
      { id: 'vase', d: 'M75 140h50l10 50H65z', defaultColor: '#DDA0DD' },
      { id: 'stem1', d: 'M95 140v-50', defaultColor: '#228B22', strokeWidth: 3 },
      { id: 'stem2', d: 'M105 140v-60', defaultColor: '#228B22', strokeWidth: 3 },
      { id: 'stem3', d: 'M100 140c0-40-20-50-20-50', defaultColor: '#228B22', strokeWidth: 3 },
      { id: 'stem4', d: 'M100 140c0-40 20-50 20-50', defaultColor: '#228B22', strokeWidth: 3 },
      { id: 'flower1-petals', d: 'M95 90a15 15 0 1 1-15-15 15 15 0 1 1 15-15 15 15 0 1 1 15 15 15 15 0 1 1-15 15z', defaultColor: '#FF6B6B' },
      { id: 'flower1-center', d: 'M95 75a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', defaultColor: '#FFD700' },
      { id: 'flower2-petals', d: 'M105 70a12 12 0 1 1-12-12 12 12 0 1 1 12-12 12 12 0 1 1 12 12 12 12 0 1 1-12 12z', defaultColor: '#87CEEB' },
      { id: 'flower2-center', d: 'M105 58a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', defaultColor: '#FFD700' },
      { id: 'flower3', d: 'M80 100a10 10 0 1 0-20 0 10 10 0 0 0 20 0z', defaultColor: '#DDA0DD' },
      { id: 'flower4', d: 'M140 100a10 10 0 1 0-20 0 10 10 0 0 0 20 0z', defaultColor: '#FFB6C1' },
      { id: 'leaf1', d: 'M70 130c-10-20 0-30 10-20 10 10-5 25-10 20z', defaultColor: '#90EE90' },
      { id: 'leaf2', d: 'M130 130c10-20 0-30-10-20-10 10 5 25 10 20z', defaultColor: '#90EE90' },
    ]
  }
];

const ColoringBook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [pathColors, setPathColors] = useState<Record<string, Record<string, string>>>({});

  const currentPage = coloringPages[currentPageIndex];

  const getPathColor = (pageId: string, pathId: string, defaultColor: string) => {
    return pathColors[pageId]?.[pathId] || defaultColor;
  };

  const handlePathClick = (pathId: string) => {
    if (pathId === 'bg') return; // Don't allow coloring the background for cleaner experience
    
    setPathColors(prev => ({
      ...prev,
      [currentPage.id]: {
        ...prev[currentPage.id],
        [pathId]: selectedColor
      }
    }));
  };

  const resetPage = () => {
    setPathColors(prev => ({
      ...prev,
      [currentPage.id]: {}
    }));
    toast({ title: "Page reset!" });
  };

  const downloadImage = () => {
    const svg = document.getElementById('coloring-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 600, 600);
      const link = document.createElement('a');
      link.download = `${currentPage.title.toLowerCase().replace(' ', '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: "Image downloaded!" });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/date-night')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">{currentPage.title}</h1>
            <p className="text-xs text-muted-foreground">Tap shapes to color them</p>
          </div>
          <Button variant="ghost" size="icon" onClick={resetPage}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadImage}>
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md aspect-square overflow-hidden">
          <CardContent className="p-0 h-full">
            <svg
              id="coloring-svg"
              viewBox={currentPage.viewBox}
              className="w-full h-full"
              style={{ touchAction: 'manipulation' }}
            >
              {currentPage.paths.map((path) => (
                <path
                  key={path.id}
                  d={path.d}
                  fill={path.strokeWidth ? 'none' : getPathColor(currentPage.id, path.id, path.defaultColor)}
                  stroke={path.strokeWidth ? getPathColor(currentPage.id, path.id, path.defaultColor) : '#333'}
                  strokeWidth={path.strokeWidth || 0.5}
                  onClick={() => handlePathClick(path.id)}
                  className={path.id !== 'bg' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                />
              ))}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPageIndex(i => Math.max(0, i - 1))}
          disabled={currentPageIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPageIndex + 1} / {coloringPages.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPageIndex(i => Math.min(coloringPages.length - 1, i + 1))}
          disabled={currentPageIndex === coloringPages.length - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Color Palette */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Colors</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  selectedColor === color ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColoringBook;
