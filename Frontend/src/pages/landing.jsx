import React from "react";
import "../App.css";
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
    const router = useNavigate();
    
    return (
        <div className="landingPageContainer">
            <nav className="glassNav">
                <div className="navHeader">
                    <h2>LiveConnect Meet</h2>
                </div>
                <div className="navList">
                    <p onClick={() => {
                        router("/aljk23")
                    }}>Join as Guest</p>
                    
                    <p onClick={() => {
                        router("/auth")
                    }}>Register</p>
                    
                    <div onClick={() => {
                        router("/auth")
                    }} role='button' style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                    }}>
                        <p style={{fontWeight: 600}}>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div style={{ flex: 1 }}>
                    <h1>Professional Video Calls <br/> <span style={{ color: "#0b5cff" }}>For Everyone</span></h1>
                    <p>Experience crystal-clear video, real-time collaboration, and secure meetings with our professional conferencing suite.</p>
                    
                    <Link to={"/auth"} className="getStartedBtn"> 
                        Get Started Free
                    </Link>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <img 
                        src="/mobile.png" 
                        alt="Product Showcase" 
                        style={{ 
                            height: '60vh', 
                            filter: 'drop-shadow(0 20px 50px rgba(11, 92, 255, 0.4))' 
                        }} 
                    />
                </div>
            </div>
        </div>
    );
} 
