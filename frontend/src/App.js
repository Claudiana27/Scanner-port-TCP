import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Box, Divider
} from '@mui/material';

function App() {
  const [target, setTarget] = useState('');
  const [portRange, setPortRange] = useState('20-100');
  const [threads, setThreads] = useState(10);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);

  const handleScan = () => {
    setResults([]);
    setLogs(prev => [...prev, `📡 Démarrage du scan de ${target} (${portRange})...`]);

    // Construire l'URL avec query params
    const url = `https://scanner-port-tcp-3.onrender.com/scan-stream?target=${encodeURIComponent(target)}&portRange=${encodeURIComponent(portRange)}&threads=${threads}`;

    const source = new EventSource(url);

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Data reçue:", data);
        setResults(prev => [...prev, data]);
        setLogs(prev => [...prev, `Port ${data.port} ouvert (service: ${data.service})`]);
      } catch {
        console.warn("Impossible de parser JSON:", e.data);
      }
    };
    

    source.addEventListener('done', () => {
      setLogs(prev => [...prev, '✅ Scan terminé.']);
      source.close();
    });

    source.onerror = () => {
      setLogs(prev => [...prev, '❌ Erreur SSE']);
      source.close();
    };
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>Scanner de ports</Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField label="Adresse IP / Hôte" fullWidth value={target} onChange={e => setTarget(e.target.value)} />
        <TextField label="Plage de ports (ex: 20-100)" value={portRange} onChange={e => setPortRange(e.target.value)} />
        <TextField label="Nombre de threads" type="number" value={threads} onChange={e => setThreads(Number(e.target.value))} />
      </Box>
      <Box display="flex" gap={2} mb={3}>
      <Button variant="contained" 
  onClick={handleScan}
  sx={{ backgroundColor: '#0f9d58', '&:hover': { backgroundColor: '#0c7c45' } }}
>
  Démarrer le scan
</Button>
        <Button variant="outlined" onClick={() => { setResults([]); setLogs([]); }}>Réinitialiser</Button>
      </Box>
      <Divider />
      <Typography variant="h6" sx={{ mt: 3 }}>Résultats</Typography>
      <TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow sx={{ backgroundColor: '#A5D6A7' }}> 
        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Port</TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>État</TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Service</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {results.length === 0 ? (
        <TableRow>
          <TableCell colSpan={3} align="center">Aucun port détecté</TableCell>
        </TableRow>
      ) : (
        results.map((r, i) => (
          <TableRow key={i}>
            <TableCell sx={{ color: '#0f9d58' }}>{r.port}</TableCell> {/* Vert pailleté */}
            <TableCell sx={{ color: '#0f9d58' }}>Ouvert</TableCell>
            <TableCell sx={{ color: '#0f9d58' }}>{r.service}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</TableContainer>
      <Typography variant="h6" sx={{ mt: 3 }}>Journal</Typography>
      <Paper variant="outlined" sx={{ p: 2, mt: 1, background: '#f9f9f9', minHeight: 100 }}>
        {logs.map((l, i) => <Typography key={i}>{l}</Typography>)}
      </Paper>
    </Container>
  );
}

export default App;
