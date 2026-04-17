import React, { useEffect, useState } from "react";
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const router = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            router("/auth");
        }
    };
    
    return (
        <div className="landingPageContainer">
            <nav>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <img src="/logo.png" alt="AeroMeet 3D" style={{height: '40px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))'}} />
                    <h2>AeroMeet</h2>
                </div>
                <div className="navList">
                    <p onClick={() => router("/aljk23")}>Join as Guest</p>
                    <p onClick={() => router("/auth")}>Register</p>
                    <div onClick={() => router("/auth")} role='button' style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <p style={{fontWeight: 700, margin: 0, color: '#fff'}}>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="landingTextSection">
                    <h1>Lightweight Video Calls <br/> <span className="gradient-text">Redefined.</span></h1>
                    <p>Experience zero-latency video, real-time reactions, and offline capabilities. Install AeroMeet directly to your device — taking up less than 5MB of storage.</p>
                    
                    <button onClick={handleInstallClick} className="getStartedBtn" style={{ border: 'none', cursor: 'pointer' }}> 
                        {deferredPrompt ? 'Install App' : 'Get Started Free'}
                    </button>
                    <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#666'}}>Works on iOS, Android, macOS & Windows.</p>
                </div>

                <div className="heroImageSection">
                    <img 
                        src="/mobile.png" 
                        alt="Product Showcase" 
                    />
                </div>
            </div>
        </div>
    );
} 
