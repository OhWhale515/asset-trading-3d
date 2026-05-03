'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Define a Trade object
interface Trade {
  id: string;
  price: number;
  quantity: number;
  isBuyerMaker: boolean; // True usually means it was a "sell" order hitting the bid
  timestamp: number;
}

const MAX_TRADES = 100;

function TradeInstancedMesh({ trades, basePrice }: { trades: Trade[]; basePrice: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const colorBuy = new THREE.Color('#10b981'); // Emerald 500
  const colorSell = new THREE.Color('#ef4444'); // Red 500

  useFrame(() => {
    if (!meshRef.current || trades.length === 0) return;

    trades.forEach((trade, i) => {
      // Calculate position
      // X = Time (latest is right, oldest is left)
      const x = (i - trades.length) * 0.5;
      
      // Y = Price difference from base price (scaled)
      const yDiff = (trade.price - basePrice) * 10;
      
      // Z = Quantity (gives depth)
      const zScale = Math.min(Math.max(trade.quantity * 5, 0.5), 5); // Scale between 0.5 and 5
      
      // We position the bottom of the box at the price level
      const yPos = yDiff;

      dummy.position.set(x, yPos, 0);
      dummy.scale.set(0.4, zScale, 0.4);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, trade.isBuyerMaker ? colorSell : colorBuy);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_TRADES]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [symbol] = useState('btcusdt');

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      const quantity = parseFloat(data.q);
      
      setBasePrice((prev) => (prev === null ? price : prev));

      setTrades((prev) => {
        const newTrades = [...prev, {
          id: data.t.toString(),
          price,
          quantity,
          isBuyerMaker: data.m,
          timestamp: data.T
        }];
        if (newTrades.length > MAX_TRADES) return newTrades.slice(-MAX_TRADES);
        return newTrades;
      });
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div className="w-full h-screen bg-black relative">
      <div className="absolute top-8 left-8 z-10 text-white font-mono bg-black/50 p-6 rounded-lg backdrop-blur border border-white/10">
        <h1 className="text-2xl font-bold text-emerald-400 mb-2">3D Market Terrain</h1>
        <p className="text-neutral-400 mb-4">Live Binance WebSocket Feed: <span className="text-white uppercase">{symbol}</span></p>
        
        <div className="flex gap-8">
          <div>
            <span className="text-xs text-neutral-500 uppercase">Latest Price</span>
            <p className="text-xl font-bold">${trades[trades.length - 1]?.price.toFixed(2) || '---'}</p>
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase">Live Trades</span>
            <p className="text-xl font-bold">{trades.length}/{MAX_TRADES}</p>
          </div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 5, 20], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        
        <Grid 
          infiniteGrid 
          fadeDistance={50} 
          sectionColor="#202020" 
          cellColor="#101010" 
          position={[0, -5, 0]} 
        />
        
        {basePrice !== null && (
          <TradeInstancedMesh trades={trades} basePrice={basePrice} />
        )}

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
