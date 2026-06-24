import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

interface DesignCustomizerProps {
  backgroundImage: string;
  designImage: string;
  onUpdate: (data: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  width: number;
  height: number;
}

const DesignCustomizer: React.FC<DesignCustomizerProps> = ({ backgroundImage, designImage, onUpdate, width, height }) => {
  const [bg] = useImage(backgroundImage, 'anonymous');
  const [design] = useImage(designImage, 'anonymous');
  
  const [shapeProps, setShapeProps] = useState({
    x: width / 2,
    y: height / 2,
    width: 200,
    height: 200,
    rotation: 0,
  });
  
  const [isSelected, setIsSelected] = useState(false);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => {
    const newProps = {
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y(),
    };
    setShapeProps(newProps);
    onUpdate(newProps);
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newProps = {
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    };
    setShapeProps(newProps);
    onUpdate(newProps);
  };

  return (
    <div className="relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden shadow-inner border border-gray-200">
      <Stage
        width={width}
        height={height}
        onMouseDown={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            setIsSelected(false);
          }
        }}
        onTouchStart={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            setIsSelected(false);
          }
        }}
      >
        <Layer>
          {bg && (
            <KonvaImage
              image={bg}
              width={width}
              height={height}
              listening={false}
            />
          )}
          {design && (
            <KonvaImage
              image={design}
              {...shapeProps}
              draggable
              ref={shapeRef}
              onClick={() => setIsSelected(true)}
              onTap={() => setIsSelected(true)}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              offsetX={shapeProps.width / 2}
              offsetY={shapeProps.height / 2}
            />
          )}
          {isSelected && (
            <Transformer
              ref={trRef}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
      
      {!isSelected && design && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold animate-bounce">
          Tap design to move/resize
        </div>
      )}
    </div>
  );
};

export default DesignCustomizer;
