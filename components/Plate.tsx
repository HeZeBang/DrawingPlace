'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';

const Plate = ({ dataSource, onSelectColor, selectedColor }) => {
    if (!dataSource) return null;
    
    return (
        <div className="flex flex-wrap gap-2 justify-center items-center max-w-[620px] mx-auto p-2 bg-card rounded-xl border shadow-sm">
            {dataSource.map(color => (
                <button
                    key={color} 
                    className={cn(
                        "w-8 h-8 rounded-full border-none transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        selectedColor === '#' + color ? 'border-primary scale-110 ring-2 ring-ring ring-offset-2' : 'border-transparent'
                    )}
                    style={{ backgroundColor: '#' + color }}
                    onClick={() => onSelectColor('#' + color)}
                    aria-label={`Select color #${color}`}
                />
            ))}
            
            <div className="w-px h-8 bg-border mx-2" />
            
            <ColorPicker 
                value={selectedColor || '#000000'}
                onValueChange={(color) => onSelectColor(color.hex)}
            >
                <Button 
                    variant="outline" 
                    size="icon" 
                    className={cn(
                        "w-8 h-8 rounded-full p-0 border-none",
                        selectedColor && !dataSource.includes(selectedColor.replace('#', '')) && "ring-2 ring-ring ring-offset-2"
                    )}
                    style={{ 
                        backgroundColor: selectedColor && !dataSource.includes(selectedColor.replace('#', '')) ? selectedColor : undefined 
                    }}
                >
                    {(!selectedColor || dataSource.includes(selectedColor.replace('#', ''))) && <Paintbrush className="h-4 w-4" />}
                </Button>
            </ColorPicker>
        </div>
    );
};

export default Plate;
