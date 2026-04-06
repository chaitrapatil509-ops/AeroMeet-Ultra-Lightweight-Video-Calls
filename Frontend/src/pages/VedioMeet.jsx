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
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();

    // Sidebar states: closed, chat, notes
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


    useEffect(() => {
        getPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    };

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
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
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
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
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

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
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };
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

    let handleVideo = () => {
        setVideo(!video);
    };

    let handleAudio = () => {
        setAudio(!audio)
    };

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    let handleScreen = () => {
        setScreen(!screen);
    };

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    };

    let toggleChat = () => {
        if(sidebarTab === "chat") {
            setSidebarTab("closed");
        } else {
            setSidebarTab("chat");
            setNewMessages(0);
        }
    };

    let toggleNotes = () => {
        if(sidebarTab === "notes") {
            setSidebarTab("closed");
        } else {
            setSidebarTab("notes");
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current && sidebarTab !== "chat") {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        if (message.trim() === "") return;
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    };

    // Chat enter support
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

    let connect = () => {
        setAskForUsername(false);
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
                    
                    <div className={styles.mainLayout}>
                        {/* Video Grid  */}
                        <div className={styles.conferenceView}>
                            <div className={styles.videoGrid}>
                                {/* Local Video */}
                                <div className={styles.videoWrapper}>
                                    <video ref={localVideoref} autoPlay muted></video>
                                    <div className={styles.videoOverlay}>{username} (You)</div>
                                </div>

                                {/* Remote Videos */}
                                {videos.map((vid) => (
                                    <div key={vid.socketId} className={styles.videoWrapper}>
                                        <video
                                            data-socket={vid.socketId}
                                            ref={ref => {
                                                if (ref && vid.stream) {
                                                    ref.srcObject = vid.stream;
                                                }
                                            }}
                                            autoPlay
                                        ></video>
                                        <div className={styles.videoOverlay}>Participant</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar (Chat / Notes) */}
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
                                            <span>My Notes (Local)</span>
                                            <CloseIcon className={styles.closeIcon} onClick={() => setSidebarTab("closed")} />
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
                            </div>
                        )}
                    </div>

                    {/* Bottom Zoom-style control Bar */}
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
                            {screenAvailable === true && (
                                <button className={styles.toolButtonWrapper} onClick={handleScreen}>
                                    {screen === true ? <ScreenShareIcon style={{ color: "#28a745" }} /> : <StopScreenShareIcon style={{ color: "#fff" }} />}
                                    <p>{screen === true ? "Stop Share" : "Share Screen"}</p>
                                </button>
                            )}

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
                                    <ChatIcon style={{ color: sidebarTab === "chat" ? "#0b5cff" : "#fff" }} />
                                </Badge>
                                <p>Chat</p>
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