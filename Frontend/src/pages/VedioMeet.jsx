import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import PanToolIcon from '@mui/icons-material/PanTool';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);

    // Sidebar states: closed, chat, notes, whiteboard
    let [sidebarTab, setSidebarTab] = useState("closed"); 

    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    
    // Notes state
    let [personalNotes, setPersonalNotes] = useState("");

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    // Recording State
    let [isRecording, setIsRecording] = useState(false);
    let mediaRecorderRef = useRef(null);
    let recordedChunks = useRef([]);

    // Captions State
    let [captionsEnabled, setCaptionsEnabled] = useState(false);
    let [activeCaption, setActiveCaption] = useState("");
    let recognitionRef = useRef(null);

    // Whiteboard State
    const canvasRef = useRef(null);
    let [isDrawing, setIsDrawing] = useState(false);

    // Enterprise Features
    let [isFullscreen, setIsFullscreen] = useState(false);
    let [meetingStartTime, setMeetingStartTime] = useState(null);
    let [meetingDuration, setMeetingDuration] = useState("00:00");
    let [videoDevices, setVideoDevices] = useState([]);
    let [audioDevices, setAudioDevices] = useState([]);
    let [selectedVideoDevice, setSelectedVideoDevice] = useState("");
    let [selectedAudioDevice, setSelectedAudioDevice] = useState("");

    // Advanced Features
    let [flyingEmojis, setFlyingEmojis] = useState([]);
    let [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
    let [handRaisedUsers, setHandRaisedUsers] = useState(new Set());
    const emojiList = ["👍", "❤️", "😂", "😮", "👏", "🎉"];

    useEffect(() => {
        getPermissions();
        fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const vDevices = devices.filter(d => d.kind === 'videoinput');
            const aDevices = devices.filter(d => d.kind === 'audioinput');
            setVideoDevices(vDevices);
            setAudioDevices(aDevices);
            if (vDevices.length > 0) setSelectedVideoDevice(vDevices[0].deviceId);
            if (aDevices.length > 0) setSelectedAudioDevice(aDevices[0].deviceId);
        } catch (err) { console.log(err) }
    };

    useEffect(() => {
        if (meetingStartTime) {
            const interval = setInterval(() => {
                let diff = Math.floor((Date.now() - meetingStartTime) / 1000);
                let m = String(Math.floor(diff / 60)).padStart(2, '0');
                let s = String(diff % 60).padStart(2, '0');
                setMeetingDuration(`${m}:${s}`);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [meetingStartTime]);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
            if (videoPermission) setVideoAvailable(true); else setVideoAvailable(false);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            if (audioPermission) setAudioAvailable(true); else setAudioAvailable(false);

            if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true); else setScreenAvailable(false);

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable }).catch(() => null);
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { }

        window.localStream = stream
        if(localVideoref.current) localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                }).catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(t => t.stop())
            } catch (e) {  }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            if(localVideoref.current) localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description).then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    }).catch(e => console.log(e))
                })
            }
        })
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            let constraints = { video: video, audio: audio };
            if (selectedVideoDevice && video) constraints.video = { deviceId: { exact: selectedVideoDevice } };
            if (selectedAudioDevice && audio) constraints.audio = { deviceId: { exact: selectedAudioDevice } };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    };

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { }

        window.localStream = stream
        if(localVideoref.current) localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                }).catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(t => t.stop())
            } catch (e) { }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            if(localVideoref.current) localVideoref.current.srcObject = window.localStream

            getUserMedia()
        })
    };

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            // Canvas receiver
            socketRef.current.on('whiteboard-draw', (data) => {
                if(!canvasRef.current) return;
                const ctx = canvasRef.current.getContext("2d");
                if(data.type === "draw") {
                    ctx.lineTo(data.x, data.y);
                    ctx.stroke();
                } else if(data.type === "start") {
                    ctx.beginPath();
                    ctx.moveTo(data.x, data.y);
                } else if(data.type === "clear") {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            })

            // Captions receiver
            socketRef.current.on('caption-message', (text, senderId) => {
                setActiveCaption(`${text}`);
                setTimeout(() => setActiveCaption(""), 5000); 
            })

            // Meeting Action receiver (Emojis & Hand Raise)
            socketRef.current.on('meeting-action', (data, senderId) => {
                if (data.type === "emoji") {
                    setFlyingEmojis(prev => [...prev, {id: Date.now() + Math.random(), emoji: data.emoji, left: Math.random() * 80 + 10}]);
                    setTimeout(() => {
                        setFlyingEmojis(prev => prev.slice(1));
                    }, 3000);
                } else if (data.type === "hand-raise") {
                    setHandRaisedUsers(prev => {
                        const newSet = new Set(prev);
                        if (data.raised) newSet.add(senderId);
                        else newSet.delete(senderId);
                        return newSet;
                    });
                }
            })

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true };
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue
                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    };

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    };

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    };

    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio);

    useEffect(() => {
        if (screen !== undefined) {
            if(navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    let handleScreen = () => setScreen(!screen);

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    };

    let toggleChat = () => {
        setSidebarTab(sidebarTab === "chat" ? "closed" : "chat");
        if(sidebarTab !== "chat") setNewMessages(0);
    };

    let toggleNotes = () => setSidebarTab(sidebarTab === "notes" ? "closed" : "notes");
    let toggleWhiteboard = () => setSidebarTab(sidebarTab === "whiteboard" ? "closed" : "whiteboard");

    // Clear functions
    let clearNotes = () => setPersonalNotes("");
    
    let clearWhiteboardState = () => {
        if(!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        socketRef.current.emit("whiteboard-draw", { type: "clear" });
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
        if (socketIdSender !== socketIdRef.current && sidebarTab !== "chat") {
            setNewMessages((prev) => prev + 1);
        }
    };

    let sendMessage = () => {
        if (message.trim() === "") return;
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    let copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Meeting link copied to clipboard!");
    };

    // Recording Logic
    const toggleRecording = async () => {
        if(isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (e) => {
                    if(e.data.size > 0) recordedChunks.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'liveconnect-recording.webm';
                    a.click();
                    recordedChunks.current = [];
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
                stream.getVideoTracks()[0].onended = () => {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                };
            } catch(e) {
                console.error(e);
            }
        }
    }

    // Captions Logic
    const toggleCaptions = () => {
        if(captionsEnabled) {
            recognitionRef.current?.stop();
            setCaptionsEnabled(false);
            setActiveCaption("");
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if(!SpeechRecognition) return alert("Captions are not supported in this browser.");
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (e) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if(e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
                    else interimTranscript += e.results[i][0].transcript;
                }
                const text = finalTranscript || interimTranscript;
                socketRef.current.emit("caption-message", text);
                setActiveCaption(text);
            };
            recognition.start();
            recognitionRef.current = recognition;
            setCaptionsEnabled(true);
        }
    };

    // Whiteboard logic
    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = canvasRef.current.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        socketRef.current.emit("whiteboard-draw", { x: offsetX, y: offsetY, type: "start" });
    };

    const draw = (e) => {
        if(!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = canvasRef.current.getContext("2d");
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        socketRef.current.emit("whiteboard-draw", { x: offsetX, y: offsetY, type: "draw" });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Advanced Feature Methods
    const sendEmoji = (emoji) => {
        socketRef.current.emit("meeting-action", { type: "emoji", emoji });
        setFlyingEmojis(prev => [...prev, {id: Date.now(), emoji: emoji, left: Math.random() * 80 + 10}]);
        setTimeout(() => setFlyingEmojis(prev => prev.slice(1)), 3000);
        setEmojiMenuOpen(false);
    };

    const toggleHandRaise = () => {
        const alreadyRaised = handRaisedUsers.has(socketIdRef.current);
        setHandRaisedUsers(prev => {
            const newSet = new Set(prev);
            if(!alreadyRaised) newSet.add(socketIdRef.current);
            else newSet.delete(socketIdRef.current);
            return newSet;
        });
        socketRef.current.emit("meeting-action", { type: "hand-raise", raised: !alreadyRaised });
    };

    const togglePiP = async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (localVideoref.current) {
            await localVideoref.current.requestPictureInPicture().catch(console.error);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.log(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    let connect = () => {
        setAskForUsername(false);
        setMeetingStartTime(Date.now());
        getMedia();
    };

    return (
        <div>
            {askForUsername === true ? (
                <div className={styles.setupContainer}>
                    <h2 style={{fontWeight: 300, fontSize: "2rem", marginBottom: "20px"}}>Enter Meeting Lobby</h2>
                    <TextField 
                        id="outlined-basic" 
                        label="Enter your username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        variant="outlined" 
                        style={{ background: 'white', borderRadius: '5px', width: '300px', marginBottom: '20px' }}
                    />
                    <Button variant="contained" size="large" onClick={connect} style={{marginBottom: "30px", background: "#0b5cff"}}>Join Meeting</Button>
                    <div className={styles.setupVideo}>
                        <video ref={localVideoref} autoPlay muted style={{width: '100%', borderRadius: '12px'}}></video>
                    </div>
                </div> 
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Meeting Timer Overlay */}
                    <div className={styles.meetingTimer}>
                        <span style={{color: '#ff3b3b', marginRight: '8px'}}>●</span> 
                        {meetingDuration}
                    </div>

                    {/* Render Flying Emojis */}
                    {flyingEmojis.map(item => (
                        <div key={item.id} className={styles.flyingEmoji} style={{left: `${item.left}%`}}>
                            {item.emoji}
                        </div>
                    ))}
                    
                    <div className={styles.mainLayout}>
                        {/* Video Grid  */}
                        <div className={styles.conferenceView} style={{position: 'relative'}}>
                            
                            {/* Live Captions Overlay */}
                            {activeCaption && (
                                <div style={{position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '18px', zIndex: 50, maxWidth: '80%', textAlign: 'center'}}>
                                    {activeCaption}
                                </div>
                            )}

                            <div className={styles.videoGrid}>
                                <div className={`${styles.videoWrapper} ${handRaisedUsers.has(socketIdRef.current) ? styles.handRaised : ""}`}>
                                    <video ref={localVideoref} autoPlay muted></video>
                                    <div className={styles.videoOverlay}>
                                        <SignalCellularAltIcon style={{fontSize: '16px', color: '#00cc66'}} />
                                        {username} (You)
                                    </div>
                                </div>

                                {videos.map((vid) => (
                                    <div key={vid.socketId} className={`${styles.videoWrapper} ${handRaisedUsers.has(vid.socketId) ? styles.handRaised : ""}`}>
                                        <video
                                            data-socket={vid.socketId}
                                            ref={ref => { if (ref && vid.stream) ref.srcObject = vid.stream; }}
                                            autoPlay
                                        ></video>
                                        <div className={styles.videoOverlay}>
                                            <SignalCellularAltIcon style={{fontSize: '16px', color: '#00cc66'}} />
                                            Participant
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar */}
                        {sidebarTab !== "closed" && (
                            <div className={styles.sidebar}>
                                
                                {sidebarTab === "chat" && (
                                    <div className={styles.chatContainer}>
                                        <div className={styles.sidebarHeader}>
                                            <span>Meeting Chat</span>
                                            <CloseIcon className={styles.closeIcon} onClick={() => setSidebarTab("closed")} />
                                        </div>
                                        <div className={styles.chattingDisplay}>
                                            {messages.length !== 0 ? messages.map((item, index) => (
                                                <div className={styles.chatMessage} key={index}>
                                                    <p className={styles.sender}>{item.sender}</p>
                                                    <p className={styles.text}>{item.data}</p>
                                                </div>
                                            )) : <p style={{color: "#888", textAlign: "center", marginTop: "20px"}}>No Messages Yet</p>}
                                        </div>
                                        <div className={styles.chattingArea}>
                                            <TextField 
                                                fullWidth
                                                value={message} 
                                                onChange={(e) => setMessage(e.target.value)} 
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message..." 
                                                variant="outlined" 
                                                size="small"
                                            />
                                            <IconButton onClick={sendMessage} color="primary" style={{ background: '#0b5cff', color: 'white', borderRadius: '8px' }}>
                                                <SendIcon />
                                            </IconButton>
                                        </div>
                                    </div>
                                )}

                                {sidebarTab === "notes" && (
                                    <div className={styles.chatContainer}>
                                        <div className={styles.sidebarHeader}>
                                            <span>My Notes</span>
                                            <div>
                                                <Button size="small" color="error" onClick={clearNotes}>Clear All</Button>
                                                <CloseIcon className={styles.closeIcon} onClick={() => setSidebarTab("closed")} />
                                            </div>
                                        </div>
                                        <div className={styles.notesArea}>
                                            <textarea 
                                                placeholder="Type your personal meeting notes here (saved locally for this session)..."
                                                value={personalNotes}
                                                onChange={(e) => setPersonalNotes(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                )}

                                {sidebarTab === "settings" && (
                                    <div className={styles.chatContainer}>
                                        <div className={styles.sidebarHeader}>
                                            <span>Device Settings</span>
                                            <CloseIcon className={styles.closeIcon} onClick={() => setSidebarTab("closed")} />
                                        </div>
                                        <div style={{padding: '20px'}}>
                                            <label className={styles.settingsLabel}>Camera Output</label>
                                            <select className={styles.deviceSelect} value={selectedVideoDevice} onChange={(e) => { setSelectedVideoDevice(e.target.value); getMedia(); }}>
                                                {videoDevices.map(device => (
                                                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId.substring(0,5)}`}</option>
                                                ))}
                                            </select>
                                            <label className={styles.settingsLabel}>Microphone Input</label>
                                            <select className={styles.deviceSelect} value={selectedAudioDevice} onChange={(e) => { setSelectedAudioDevice(e.target.value); getMedia(); }}>
                                                {audioDevices.map(device => (
                                                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.substring(0,5)}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {sidebarTab === "whiteboard" && (
                                    <div className={styles.chatContainer}>
                                        <div className={styles.sidebarHeader}>
                                            <span>Whiteboard</span>
                                            <div>
                                                <Button size="small" color="error" onClick={clearWhiteboardState}>Clear All</Button>
                                                <CloseIcon className={styles.closeIcon} onClick={() => setSidebarTab("closed")} />
                                            </div>
                                        </div>
                                        <div style={{flex: 1, position: 'relative', background: '#fafafa', cursor: 'crosshair'}}>
                                            <canvas
                                                ref={canvasRef}
                                                width={400}
                                                height={800}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseOut={stopDrawing}
                                                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none'}}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Toolbar */}
                    <div className={styles.buttonContainers}>
                        <div className={styles.toolbarGroup}>
                            <button className={styles.toolButtonWrapper} onClick={handleAudio}>
                                {audio === true ? <MicIcon style={{ color: "#fff" }} /> : <MicOffIcon style={{ color: "#d93025" }}/>}
                                <p>{audio === true ? "Mute" : "Unmute"}</p>
                            </button>
                            
                            <button className={styles.toolButtonWrapper} onClick={handleVideo}>
                                {(video === true) ? <VideocamIcon style={{ color: "#fff" }} /> : <VideocamOffIcon style={{ color: "#d93025" }} />}
                                <p>{video === true ? "Stop Video" : "Start Video"}</p>
                            </button>
                        </div>

                        <div className={styles.toolbarGroup}>
                            <button className={styles.toolButtonWrapper} onClick={toggleRecording}>
                                <FiberManualRecordIcon style={{ color: isRecording ? "#ff3b3b" : "#fff" }} />
                                <p>{isRecording ? "Stop Rec" : "Record"}</p>
                            </button>

                            {screenAvailable === true && (
                                <button className={styles.toolButtonWrapper} onClick={handleScreen}>
                                    {screen === true ? <ScreenShareIcon style={{ color: "#28a745" }} /> : <StopScreenShareIcon style={{ color: "#fff" }} />}
                                    <p>{screen === true ? "Stop Share" : "Share Screen"}</p>
                                </button>
                            )}

                            <div style={{position: 'relative'}}>
                                {emojiMenuOpen && (
                                    <div className={styles.emojiMenu}>
                                        {emojiList.map(emp => (
                                            <span key={emp} className={styles.emojiSelect} onClick={() => sendEmoji(emp)}>{emp}</span>
                                        ))}
                                    </div>
                                )}
                                <button className={styles.toolButtonWrapper} onClick={() => setEmojiMenuOpen(!emojiMenuOpen)}>
                                    <EmojiEmotionsIcon style={{ color: emojiMenuOpen ? "#0b5cff" : "#fff" }} />
                                    <p>React</p>
                                </button>
                            </div>

                            <button className={styles.toolButtonWrapper} onClick={toggleHandRaise}>
                                <PanToolIcon style={{ color: handRaisedUsers.has(socketIdRef.current) ? "#fbbc05" : "#fff" }} />
                                <p>Raise Hand</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={togglePiP}>
                                <PictureInPictureAltIcon style={{ color: "#fff" }} />
                                <p>PiP</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={toggleWhiteboard}>
                                <AutoFixHighIcon style={{ color: sidebarTab === "whiteboard" ? "#0b5cff" : "#fff" }} />
                                <p>Whiteboard</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={toggleCaptions}>
                                <SubtitlesIcon style={{ color: captionsEnabled ? "#0b5cff" : "#fff" }} />
                                <p>Captions</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={copyLink}>
                                <ContentCopyIcon style={{ color: "#fff" }} />
                                <p>Copy Link</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={toggleNotes}>
                                <EventNoteIcon style={{ color: sidebarTab === "notes" ? "#0b5cff" : "#fff" }} />
                                <p>Notes</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={toggleChat}>
                                <Badge badgeContent={newMessages} max={99} color='error'>
                                    <ChatIcon style={{ color: sidebarTab === "chat" ? "#0066ff" : "#fff" }} />
                                </Badge>
                                <p>Chat</p>
                            </button>
                            
                            <button className={styles.toolButtonWrapper} onClick={toggleFullscreen}>
                                {isFullscreen ? <FullscreenExitIcon style={{ color: "#fff" }} /> : <FullscreenIcon style={{ color: "#fff" }} />}
                                <p>Fullscreen</p>
                            </button>

                            <button className={styles.toolButtonWrapper} onClick={() => setSidebarTab(sidebarTab === "settings" ? "closed" : "settings")}>
                                <SettingsIcon style={{ color: sidebarTab === "settings" ? "#0066ff" : "#fff" }} />
                                <p>Settings</p>
                            </button>
                        </div>

                        <div className={styles.toolbarGroup}>
                            <button className={styles.leaveButton} onClick={handleEndCall}>
                                <CallEndIcon style={{ marginRight: '5px' }} /> Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}