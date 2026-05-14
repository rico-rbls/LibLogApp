import React, { useEffect, useState } from 'react';
import { Scan, Camera, User, BookOpen, AlertTriangle } from 'lucide-react';
import { useCirculationStore } from '../store/circulationStore';
import { differenceInDays, parseISO } from 'date-fns';

const PENALTY_PER_DAY = 5;

function getDaysLate(dueDateISO: string): number {
  const days = differenceInDays(new Date(), parseISO(dueDateISO));
  return Math.max(0, days);
}

export default function CirculationManager() {
  const { isScanning, setScanning, simulateScan, scannedPatron, activeLoans, clearScan } = useCirculationStore();
  const [pulse, setPulse] = useState(false);

  // Simple pulsing effect for the mock scanner
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(interval);
  }, [isScanning]);

  const totalFines = activeLoans.reduce((total, loan) => {
    const daysLate = getDaysLate(loan.due_date);
    return total + (daysLate * PENALTY_PER_DAY);
  }, 0);

  return (
    <div className="p-8 h-full bg-[#f2f2fa]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Scan className="text-[#652D90]" size={32} />
          Circulation Manager
        </h1>
        <p className="text-gray-500 mt-2">Scan patron QR code to process returns and penalties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: SCANNER FEED */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Scanner Feed</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${isScanning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {isScanning ? 'Camera Active' : 'Standby'}
            </div>
          </div>

          <div className={`w-full aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${isScanning ? 'ring-4 ring-[#652D90]/20' : ''}`}>
            {isScanning ? (
              <>
                <Scan size={64} className={`text-white transition-opacity duration-500 ${pulse ? 'opacity-100' : 'opacity-40'}`} />
                <div className="absolute top-0 left-0 w-full h-1 bg-green-400 opacity-50 animate-scan"></div>
              </>
            ) : (
              <Camera size={48} className="text-slate-600" />
            )}
          </div>

          <div className="w-full mt-8 flex flex-col gap-4">
            <button
              onClick={() => {
                if (isScanning) clearScan();
                setScanning(!isScanning);
              }}
              className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              {isScanning ? 'Stop Camera' : 'Toggle Camera'}
            </button>
            <button
              onClick={simulateScan}
              disabled={!isScanning}
              className="w-full py-4 rounded-xl bg-[#652D90] text-white font-bold disabled:opacity-50 hover:bg-[#502473] transition-colors focus:outline-none focus:ring-4 focus:ring-[#652D90]/30"
            >
              Simulate Successful Scan
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PATRON OVERVIEW */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Patron Overview</h2>
          
          {!scannedPatron ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <User size={64} className="mb-4 opacity-20" />
              <p>Waiting for patron scan...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Profile Card */}
              <div className="bg-[#f2f2fa] rounded-2xl p-6 flex items-start gap-4 mb-8">
                <div className="w-16 h-16 bg-[#652D90] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{scannedPatron.full_name}</h3>
                  <p className="text-gray-500 font-medium">{scannedPatron.university_id} • {scannedPatron.program}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-[#652D90]/10 text-[#652D90] rounded-lg text-sm font-bold tracking-wide">
                    {scannedPatron.role}
                  </span>
                </div>
              </div>

              {/* Fines Banner */}
              {totalFines > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle size={24} />
                    <div>
                      <p className="font-bold">Accumulated Fines</p>
                      <p className="text-sm">Please settle exact amount at the desk.</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-red-700">
                    ₱{totalFines.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Active Loans */}
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-[#652D90]" />
                  Active Loans ({activeLoans.length})
                </h4>
                
                <div className="space-y-4">
                  {activeLoans.map(loan => {
                    const daysLate = getDaysLate(loan.due_date);
                    const isOverdue = daysLate > 0;
                    
                    return (
                      <div key={loan.id} className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-gray-900">{loan.resources?.title}</p>
                          <p className="text-sm text-gray-500">Borrowed: {new Date(loan.borrow_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          {isOverdue ? (
                            <>
                              <p className="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded">Overdue by {daysLate} days</p>
                              <p className="text-xs text-red-500 mt-1">Penalty: ₱{(daysLate * PENALTY_PER_DAY).toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded">
                              Due: {new Date(loan.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-4">
                 <button className="flex-1 py-4 rounded-xl bg-[#652D90] text-white font-bold hover:bg-[#502473] transition-colors">
                   Process Returns
                 </button>
                 {totalFines > 0 && (
                   <button className="flex-1 py-4 rounded-xl border-2 border-[#652D90] text-[#652D90] font-bold hover:bg-[#f2f2fa] transition-colors">
                     Clear Fines
                   </button>
                 )}
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(1000%); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
