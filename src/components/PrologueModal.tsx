import React, { useState } from 'react';
import { Sparkles, ArrowRight, Compass, Shield } from 'lucide-react';
import { soundEngine } from '../game/audio/SoundSystem';

interface PrologueModalProps {
  onStartGame: () => void;
}

export const PrologueModal: React.FC<PrologueModalProps> = ({ onStartGame }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: 'LA DESPEDIDA EN LA GRANJA',
      subtitle: 'Jackson, Wyoming — Principios de Otoño',
      quote:
        '— "No puedes salvar a alguien que no quiere ser encontrado, JJ... tu madre eligió este silencio."\n— "No la abandonaré como todos los demás, Dina. Lleva tres inviernos en las ruinas de Seattle. Si queda algo de ella, lo traeré de vuelta."',
      description:
        'JJ tomó su mochila al amanecer. Dina no pudo detenerlo, pero antes de que cruzara la cerca de madera, colocó en su palma el cuchillo que la acompañó en su viaje más oscuro.',
    },
    {
      title: 'EL CUCHILLO DE TALIA Y DINA',
      subtitle: 'Un Vínculo Forjado en la Pérdida',
      quote:
        '— "Era de mi hermana. Me mantuvo con vida cuando Ellie y yo éramos poco más que fantasmas buscando venganza. Ahora es tuyo, JJ. Recuerda quién te espera en casa."',
      description:
        'El metal gastado y el mango de nogal son ahora el único lazo de JJ con su familia. En cada golpe y en cada silencio, el cuchillo le recuerda por qué sigue respirando.',
    },
    {
      title: 'EL CAMINO A LAS RUINAS MÉDICAS',
      subtitle: 'Sector Norte — Seattle / Cascades Outpost',
      quote:
        '"Los rumores decían que una mujer solitaria con una guitarra a la espalda cruzó el complejo inundado de St. Mary\'s. JJ está herido por el trayecto, cojeando bajo la lluvia implacable, rodeado de infectados."',
      description:
        'Controla a JJ en tercera persona. Administra tus lesiones, apóyate en las paredes cuando no puedas mantenerte en pie, usa el sigilo y sobrevive a los Chasqueadores.',
    },
  ];

  const handleNext = () => {
    soundEngine.resume();
    soundEngine.playGuitarPluck(220, 0.4);
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onStartGame();
    }
  };

  const current = slides[step];

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center p-6 select-none animate-fadeIn">
      {/* Background cinematic dark gradient */}
      <div className="absolute inset-0 bg-radial-gradient from-stone-900 via-black to-black opacity-90" />

      {/* Main Narrative Card */}
      <div className="relative max-w-2xl w-full bg-stone-950/90 border border-stone-800 rounded-2xl p-8 shadow-2xl flex flex-col justify-between min-h-[500px] text-stone-200 backdrop-blur-xl">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-6">
            <div className="text-[11px] font-mono tracking-widest uppercase text-amber-500 font-bold flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>THE LAST OF US PART III: ECHOES OF ELLIE</span>
            </div>
            <div className="text-xs font-mono text-stone-500">
              PRÓLOGO {step + 1} / {slides.length}
            </div>
          </div>

          <h1 className="text-3xl font-serif font-extrabold tracking-wide text-stone-100">
            {current.title}
          </h1>
          <h2 className="text-sm font-mono text-amber-600/90 mt-1 uppercase tracking-wider">
            {current.subtitle}
          </h2>

          {/* Dialogue Quote Box */}
          <div className="bg-stone-900/60 border-l-2 border-amber-600 p-4 rounded-r-lg my-6 font-serif italic text-stone-300 text-sm leading-relaxed whitespace-pre-line">
            {current.quote}
          </div>

          <p className="text-stone-400 text-sm leading-relaxed font-sans">
            {current.description}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-stone-800 pt-6 flex items-center justify-between">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-8 bg-amber-500' : 'w-2 bg-stone-800'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="bg-stone-100 hover:bg-white text-black font-mono font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-2 transition hover:shadow-lg hover:shadow-white/10"
          >
            <span>{step === slides.length - 1 ? 'COMENZAR LA JORNADA' : 'CONTINUAR'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
