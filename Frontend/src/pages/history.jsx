import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Container, Grid } from '@mui/material';
import "../App.css";

export default function History() {
    const { getHistoryOfUser, clearHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.error(err);
            }
        }
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const clearAll = async () => {
        if(window.confirm("Are you sure you want to clear your entire meeting history?")) {
            try {
                await clearHistoryOfUser();
                setMeetings([]);
            } catch (err) {
                console.error(err);
            }
        }
    }

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
        <div className="landingPageContainer" style={{ minHeight: '100vh', overflowY: 'auto' }}>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                    <IconButton onClick={() => navigate("/home")} style={{color: 'white'}}>
                        <HomeIcon />
                    </IconButton>
                    <h2 style={{fontWeight: 800, margin: 0}} className="gradient-text">
                        AeroMeet History
                    </h2>
                </div>

                <Button 
                    onClick={clearAll} 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                >
                    Clear All
                </Button>
            </div>

            <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
                {meetings.length !== 0 ? (
                    <Grid container spacing={3}>
                        {meetings.map((e, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Card sx={{ 
                                    background: 'rgba(255,255,255,0.03)', 
                                    backdropFilter: 'blur(20px)', 
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    transition: 'transform 0.3s ease',
                                    '&:hover': { transform: 'translateY(-5px)', borderColor: 'rgba(255,255,255,0.2)' }
                                }}>
                                    <Box sx={{ p: 3 }}>
                                        <Typography sx={{ fontSize: 13, color: '#aaa', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Meeting Instance
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                            Code: {e.meetingCode}
                                        </Typography>
                                        <Typography sx={{ color: '#00d2ff', fontWeight: 500 }}>
                                            Date: {formatDate(e.date)}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#444' }}>No Meetings Found</Typography>
                        <p style={{color: '#666'}}>Your past activities will appear here once you join a meeting.</p>
                    </Box>
                )}
            </Container>
        </div>
    )
}
