import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const {addToUserHistory} = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode) return;
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div className="landingPageContainer" style={{minHeight: '100vh'}}>
            <div className="navBar" style={{backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2 style={{fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #fff, #0b5cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                        LiveConnect
                    </h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: '15px' }}>
                    <div onClick={() => navigate("/history")} style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ccc'}}>
                        <IconButton style={{color: '#ccc'}}><RestoreIcon /></IconButton>
                        <p style={{margin: 0, fontSize: '14px', fontWeight: 600}}>History</p>
                    </div>

                    <Button 
                        variant="outlined"
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                        size="small"
                        style={{color: '#ff3b3b', borderColor: 'rgba(255,59,59,0.3)', borderRadius: '8px', textTransform: 'none', fontWeight: 600}}
                        startIcon={<LogoutIcon />}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer" style={{flex: 1}}>
                <div className="dashboardCard" style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    padding: '3.5rem',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                    textAlign: 'center',
                    maxWidth: '650px',
                    width: '90%'
                }}>
                    <h2 style={{fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-1px'}}>
                        Join or Start <br/> <span style={{color: '#0b5cff'}}>A Meeting</span>
                    </h2>
                    
                    <p style={{color: '#aaa', marginBottom: '2.5rem', fontSize: '1.1rem'}}>Enter a meeting code below to join or simply click join with a code to begin.</p>

                    <div style={{ 
                        display: 'flex', 
                        gap: "12px", 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '10px', 
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <TextField 
                            onChange={e => setMeetingCode(e.target.value)} 
                            placeholder="Enter Code (e.g. ab12)" 
                            variant="standard" 
                            fullWidth
                            InputProps={{
                                disableUnderline: true,
                                style: { color: 'white', padding: '10px 15px', fontSize: '1.1rem' }
                            }}
                        />
                        <Button 
                            onClick={handleJoinVideoCall} 
                            variant='contained' 
                            style={{
                                background: '#0b5cff', 
                                borderRadius: '12px', 
                                padding: '0 30px', 
                                fontWeight: 700, 
                                textTransform: 'none',
                                boxShadow: '0 8px 16px rgba(11, 92, 255, 0.3)'
                            }}
                        >
                            Join Call
                        </Button>
                    </div>

                    <div style={{marginTop: '2rem'}}>
                        <img 
                            srcSet='/logo3.png' 
                            alt="" 
                            style={{
                                width: '100px', 
                                opacity: 0.5, 
                                filter: 'grayscale(100%) brightness(200%)'
                            }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(HomeComponent)