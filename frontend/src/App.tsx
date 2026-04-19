import { useEffect, useState } from 'react'
import {
  Container, Box, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Typography, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent,
  Chip, Stack, Alert, alpha
} from "@mui/material";
import { Delete, Add, Edit, Event, Devices, MeetingRoom, History, CheckCircle, Cancel } from "@mui/icons-material";

interface Device {
  id: string;
  name: string;
}
interface Auditory {
  id: string;
  name: string;
  capacity: number;
}

interface Booking {
  id: string;
  deviceId: string;
  auditoryId: string;
  startTime: string;
  endTime: string;
  device?: Device;
  auditory?: Auditory;
}

function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [auditories, setAuditories] = useState<Auditory[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  const [bookingForm, setBookingForm] = useState({ devId: "", audId: "", end: "" })
  const [newDevName, setNewDevName] = useState("")
  const [newAud, setNewAud] = useState({ name: "", cap: 1 })

  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)

  const [editAuditoryOpen, setEditAuditoryOpen] = useState(false)
  const [editingAuditory, setEditingAuditory] = useState<Auditory | null>(null)

  const [editBookingOpen, setEditBookingOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  const API = import.meta.env.PROD
      ? "https://room-assets-jm5t.onrender.com/api"
      : "http://localhost/api"

  const loadData = async () => {
    try {
      const [d, a, b] = await Promise.all([
        fetch(`${API}/devices`).then(r => r.json()),
        fetch(`${API}/auditories`).then(r => r.json()),
        fetch(`${API}/bookings`).then(r => r.json())
      ])
      setDevices(d); setAuditories(a); setBookings(b)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadData() }, [])

  const handleBooking = async () => {
    if (!bookingForm.devId || !bookingForm.audId || !bookingForm.end) {
      alert("Пожалуйста, заполните все поля бронирования")
      return
    }

    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: bookingForm.devId,
          auditoryId: bookingForm.audId,
          endTime: new Date(bookingForm.end).toISOString()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Ошибка")
      setBookings([data, ...bookings])
      setBookingForm({ devId: "", audId: "", end: "" })
      alert("Бронирование успешно создано!")
    } catch (e: any) { alert(e.message) }
  }

  const addDevice = async () => {
    if (!newDevName.trim()) {
      alert("Введите название устройства")
      return
    }
    await fetch(`${API}/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDevName })
    })
    setNewDevName(""); loadData()
  }

  const addAuditory = async () => {
    if (!newAud.name.trim()) {
      alert("Введите название аудитории")
      return
    }
    await fetch(`${API}/auditories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAud.name, capacity: Number(newAud.cap) })
    })
    setNewAud({ name: "", cap: 1 }); loadData()
  }

  const deleteItem = async (path: string, id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот элемент?")) {
      await fetch(`${API}/${path}/${id}`, { method: "DELETE" })
      loadData()
    }
  }

  const checkStatus = (audId: string) => {
    const activeB = bookings.find(b => b.auditoryId === audId && new Date(b.endTime) > new Date())
    return activeB ? {
      msg: `Занята до ${new Date(activeB.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      busy: true
    } : {
      msg: "Свободна",
      busy: false
    }
  }

  const getLocalDatetime = (iso: string) => {
    const date = new Date(iso)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const handleEditDevice = (d: Device) => {
    setEditingDevice(d)
    setEditDeviceOpen(true)
  }

  const saveDevice = async () => {
    if (!editingDevice) return
    try {
      const res = await fetch(`${API}/devices/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingDevice.name })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Ошибка')
      }
      setEditDeviceOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditAuditory = (a: Auditory) => {
    setEditingAuditory(a)
    setEditAuditoryOpen(true)
  }

  const saveAuditory = async () => {
    if (!editingAuditory) return
    try {
      const res = await fetch(`${API}/auditories/${editingAuditory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAuditory.name, capacity: editingAuditory.capacity })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Ошибка')
      }
      setEditAuditoryOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditBooking = (b: Booking) => {
    setEditingBooking(b)
    setEditBookingOpen(true)
  }

  const saveBooking = async () => {
    if (!editingBooking) return
    try {
      const res = await fetch(`${API}/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: editingBooking.deviceId,
          auditoryId: editingBooking.auditoryId,
          endTime: editingBooking.endTime
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Ошибка')
      setEditBookingOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  return (
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {/* Заголовок */}
        <Box sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 3,
          boxShadow: 3
        }}>
          <Container maxWidth="lg">
            <Stack direction="row" spacing={2} alignItems="center">
              <Event sx={{ fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Room Booking System
              </Typography>
            </Stack>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
              Система бронирования устройств и аудиторий
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>

          {/* Статистика */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mb: 4
          }}>
            <Box sx={{
              flex: '1 1 calc(25% - 24px)',
              minWidth: '250px'
            }}>
              <Card sx={{
                bgcolor: alpha('#3b82f6', 0.1),
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Devices sx={{ color: 'primary.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {devices.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Устройств
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{
              flex: '1 1 calc(25% - 24px)',
              minWidth: '250px'
            }}>
              <Card sx={{
                bgcolor: alpha('#10b981', 0.1),
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <MeetingRoom sx={{ color: 'success.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {auditories.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Аудиторий
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{
              flex: '1 1 calc(25% - 24px)',
              minWidth: '250px'
            }}>
              <Card sx={{
                bgcolor: alpha('#f59e0b', 0.1),
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <History sx={{ color: 'warning.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {bookings.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Бронирований
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{
              flex: '1 1 calc(25% - 24px)',
              minWidth: '250px'
            }}>
              <Card sx={{
                bgcolor: alpha('#8b5cf6', 0.1),
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircle sx={{ color: 'secondary.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {auditories.filter(a => !checkStatus(a.id).busy).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Свободно сейчас
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Секция бронирования */}
          <Card sx={{
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event sx={{ color: 'primary.main' }} />
                Новое бронирование
              </Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center'
              }}>
                <Box sx={{
                  flex: '1 1 calc(25% - 16px)',
                  minWidth: '250px'
                }}>
                  <TextField
                      select
                      label="Устройство"
                      fullWidth
                      value={bookingForm.devId}
                      onChange={e => setBookingForm({...bookingForm, devId: e.target.value})}
                      size="medium"
                  >
                    {devices.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  </TextField>
                </Box>
                <Box sx={{
                  flex: '1 1 calc(25% - 16px)',
                  minWidth: '250px'
                }}>
                  <TextField
                      select
                      label="Аудитория"
                      fullWidth
                      value={bookingForm.audId}
                      onChange={e => setBookingForm({...bookingForm, audId: e.target.value})}
                      size="medium"
                  >
                    {auditories.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                  </TextField>
                </Box>
                <Box sx={{
                  flex: '1 1 calc(25% - 16px)',
                  minWidth: '250px'
                }}>
                  <TextField
                      type="datetime-local"
                      label="Дата и время окончания"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={bookingForm.end}
                      onChange={e => setBookingForm({...bookingForm, end: e.target.value})}
                      size="medium"
                  />
                </Box>
                <Box sx={{
                  flex: '1 1 calc(25% - 16px)',
                  minWidth: '250px'
                }}>
                  <Button
                      variant="contained"
                      onClick={handleBooking}
                      size="large"
                      fullWidth
                      sx={{ height: '56px', fontSize: '1rem' }}
                  >
                    Забронировать
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Основной контент в двух колонках */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4
          }}>
            {/* Левая колонка: Устройства и аудитории */}
            <Box sx={{
              flex: '1 1 600px',
              minWidth: '300px'
            }}>
              {/* Устройства */}
              <Card sx={{
                mb: 4,
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Devices fontSize="small" />
                    Устройства
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Название</strong></TableCell>
                        <TableCell align="right"><strong>Действия</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {devices.map(d => (
                          <TableRow
                              key={d.id}
                              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <TableCell>{d.name}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                  onClick={() => handleEditDevice(d)}
                                  size="small"
                                  sx={{ color: 'primary.main' }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                  onClick={() => deleteItem('devices', d.id)}
                                  size="small"
                                  sx={{ color: 'error.main' }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Добавить новое устройство
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Введите название устройства"
                        value={newDevName}
                        onChange={e => setNewDevName(e.target.value)}
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        onClick={addDevice}
                        startIcon={<Add />}
                        sx={{ minWidth: 'auto' }}
                    >
                      Добавить
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Аудитории */}
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MeetingRoom fontSize="small" />
                    Статус аудиторий
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Название</strong></TableCell>
                        <TableCell><strong>Мест</strong></TableCell>
                        <TableCell><strong>Статус</strong></TableCell>
                        <TableCell align="right"><strong>Действия</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditories.map(a => {
                        const s = checkStatus(a.id)
                        return (
                            <TableRow
                                key={a.id}
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <TableCell>{a.name}</TableCell>
                              <TableCell>
                                <Chip
                                    label={a.capacity}
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                    label={s.msg}
                                    size="small"
                                    color={s.busy ? "error" : "success"}
                                    icon={s.busy ? <Cancel /> : <CheckCircle />}
                                    variant={s.busy ? "filled" : "outlined"}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                    onClick={() => handleEditAuditory(a)}
                                    size="small"
                                    sx={{ color: 'primary.main' }}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                    onClick={() => deleteItem('auditories', a.id)}
                                    size="small"
                                    sx={{ color: 'error.main' }}
                                >
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Добавить новую аудиторию
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Название аудитории"
                        value={newAud.name}
                        onChange={e => setNewAud({...newAud, name: e.target.value})}
                        variant="outlined"
                        sx={{ flex: 2 }}
                    />
                    <TextField
                        size="small"
                        type="number"
                        placeholder="Мест"
                        value={newAud.cap}
                        onChange={e => setNewAud({...newAud, cap: Number(e.target.value)})}
                        variant="outlined"
                        sx={{ flex: 1 }}
                    />
                    <Button
                        variant="contained"
                        onClick={addAuditory}
                        startIcon={<Add />}
                        sx={{ minWidth: 'auto' }}
                    >
                      Добавить
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Правая колонка: Журнал бронирований */}
            <Box sx={{
              flex: '1 1 600px',
              minWidth: '300px'
            }}>
              <Card sx={{
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History fontSize="small" />
                    Журнал бронирований
                  </Typography>
                  {bookings.length === 0 ? (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Нет записей о бронированиях
                      </Alert>
                  ) : (
                      <Box sx={{ maxHeight: '700px', overflow: 'auto' }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Устройство</strong></TableCell>
                              <TableCell><strong>Аудитория</strong></TableCell>
                              <TableCell><strong>Время</strong></TableCell>
                              <TableCell align="right"><strong>Действия</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bookings.map(b => {
                              const isActive = new Date(b.endTime) > new Date()
                              return (
                                  <TableRow
                                      key={b.id}
                                      sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                        bgcolor: isActive ? alpha('#10b981', 0.05) : 'inherit'
                                      }}
                                  >
                                    <TableCell>
                                      <Box>
                                        <Typography variant="body2">{b.device?.name}</Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box>
                                        <Typography variant="body2">{b.auditory?.name}</Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {new Date(b.startTime).toLocaleDateString()}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} -
                                        {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <IconButton
                                          onClick={() => handleEditBooking(b)}
                                          size="small"
                                          sx={{ color: 'primary.main' }}
                                      >
                                        <Edit />
                                      </IconButton>
                                      <IconButton
                                          onClick={() => deleteItem('bookings', b.id)}
                                          size="small"
                                          sx={{ color: 'error.main' }}
                                      >
                                        <Delete />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>

        {/* Диалог редактирования устройства */}
        <Dialog open={editDeviceOpen} onClose={() => setEditDeviceOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Редактировать устройство</DialogTitle>
          <DialogContent>
            <TextField
                label="Название устройства"
                value={editingDevice?.name || ''}
                onChange={e => setEditingDevice({...editingDevice!, name: e.target.value})}
                fullWidth
                sx={{ mt: 2 }}
                autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDeviceOpen(false)}>Отмена</Button>
            <Button onClick={saveDevice} variant="contained">Сохранить изменения</Button>
          </DialogActions>
        </Dialog>

        {/* Диалог редактирования аудитории */}
        <Dialog open={editAuditoryOpen} onClose={() => setEditAuditoryOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Редактировать аудиторию</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
                label="Название аудитории"
                value={editingAuditory?.name || ''}
                onChange={e => setEditingAuditory({...editingAuditory!, name: e.target.value})}
                fullWidth
                autoFocus
            />
            <TextField
                label="Вместимость (мест)"
                type="number"
                value={editingAuditory?.capacity || 1}
                onChange={e => setEditingAuditory({...editingAuditory!, capacity: Number(e.target.value)})}
                fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditAuditoryOpen(false)}>Отмена</Button>
            <Button onClick={saveAuditory} variant="contained">Сохранить изменения</Button>
          </DialogActions>
        </Dialog>

        {/* Диалог редактирования бронирования */}
        <Dialog open={editBookingOpen} onClose={() => setEditBookingOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Редактировать бронирование</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Начало бронирования: {editingBooking && new Date(editingBooking.startTime).toLocaleString()}
            </Alert>
            <TextField
                select
                label="Устройство"
                value={editingBooking?.deviceId || ''}
                onChange={e => setEditingBooking({...editingBooking!, deviceId: e.target.value})}
                fullWidth
            >
              {devices.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
            <TextField
                select
                label="Аудитория"
                value={editingBooking?.auditoryId || ''}
                onChange={e => setEditingBooking({...editingBooking!, auditoryId: e.target.value})}
                fullWidth
            >
              {auditories.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
            <TextField
                type="datetime-local"
                label="Дата и время окончания"
                value={editingBooking ? getLocalDatetime(editingBooking.endTime) : ''}
                onChange={e => setEditingBooking({...editingBooking!, endTime: new Date(e.target.value).toISOString()})}
                InputLabelProps={{ shrink: true }}
                fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditBookingOpen(false)}>Отмена</Button>
            <Button onClick={saveBooking} variant="contained">Сохранить изменения</Button>
          </DialogActions>
        </Dialog>

        {/* Футер */}
        <Box sx={{
          bgcolor: 'primary.dark',
          color: 'white',
          py: 3,
          mt: 4
        }}>
          <Container maxWidth="lg">
            <Typography variant="body2" align="center" sx={{ opacity: 0.8 }}>
              © {new Date().getFullYear()} Room Booking System. Все права защищены.
            </Typography>
          </Container>
        </Box>
      </Box>
  )
}

export default App