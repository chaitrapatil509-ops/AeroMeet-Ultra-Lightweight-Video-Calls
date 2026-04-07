import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, SnackbarContent } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0b5cff',
    },
    background: {
      default: '#111111',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: 'Outfit, Inter, sans-serif',
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      let messsage = err.response?.data?.message || "Something went wrong";
      setError(messsage);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'radial-gradient(circle at top right, #1e3a8a 0%, #111111 100%)',
          width: '100vw'
        }}>
        <CssBaseline />

        <Paper
          elevation={24}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 6,
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6)',
            width: '90%',
            maxWidth: '450px'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#0b5cff', width: 56, height: 56 }}>
            <LockOutlinedIcon />
          </Avatar>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0' }}>
            {formState === 0 ? "Welcome Back" : "Create Account"}
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
            <Button
              variant={formState === 0 ? "contained" : "text"}
              onClick={() => { setFormState(0) }}
              sx={{ borderRadius: '10px', fontWeight: 700 }}
            >
              Sign in
            </Button>
            <Button
              variant={formState === 1 ? "contained" : "text"}
              onClick={() => { setFormState(1) }}
              sx={{ borderRadius: '10px', fontWeight: 700 }}
            >
              Sign up
            </Button>
          </div>

          <Box component="form" noValidate sx={{ width: '100%' }}>
            {formState === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullname"
                label="Full Name"
                name="fullname"
                value={name}
                autoFocus
                onChange={(e) => { setName(e.target.value) }}
                variant="outlined"
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              value={username}
              name="username"
              autoComplete="username"
              onChange={(e) => { setUsername(e.target.value) }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              value={password}
              label="Password"
              type="password"
              id="password"
              autoComplete="password"
              onChange={(e) => { setPassword(e.target.value) }}
            />

            {error && <p style={{ color: "#ff3b3b", fontSize: '0.9rem', fontWeight: 600, margin: '10px 0' }}>{error}</p>}
            
            <Button
              type="button"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 1, height: '50px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem' }}
              onClick={handleAuth}
            >
              {formState === 0 ? "LogIn" : "Register"}
            </Button>
            
            <p style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
              By continuing, you agree to our terms and privacy policy.
            </p>
          </Box>
        </Paper>
      </div>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') return;
          setOpen(false);
        }}
      >
        <SnackbarContent
          message={message || "User Registered Successfully!"}
          sx={{
            backgroundColor: '#0b5cff',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '12px'
          }}
        />
      </Snackbar>
    </ThemeProvider>
  );
}
