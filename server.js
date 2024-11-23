const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

// Configurar multer para el almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        // Crear el directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Aceptar solo imágenes
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Solo se permiten archivos de imagen jpg, jpeg o png.'));
        }
        cb(null, true);
    }
});

const app = express();
const port = process.env.PORT || 3000;

// Configurar middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'tu_secreto_seguro',
    resave: false,
    saveUninitialized: false
}));

// Configurar base de datos SQLite
const db = new sqlite3.Database('eventos.db', (err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos SQLite');
        // Crear tablas si no existen
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            nombre TEXT,
            apellido TEXT,
            email TEXT UNIQUE,
            password TEXT,
            is_admin INTEGER DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS eventos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            fecha TEXT NOT NULL,
            hora TEXT NOT NULL,
            lugar TEXT NOT NULL,
            imagen TEXT DEFAULT 'https://i.ibb.co/RgPTxQk/default.jpg',
            creador_id INTEGER,
            FOREIGN KEY(creador_id) REFERENCES usuarios(id)
        )`);

        // Crear tabla para manejar las inscripciones a eventos
        db.run(`CREATE TABLE IF NOT EXISTS eventos_usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evento_id INTEGER,
            usuario_id INTEGER,
            fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(evento_id) REFERENCES eventos(id),
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
            UNIQUE(evento_id, usuario_id)
        )`);

        // Crear usuario admin por defecto
        const adminPassword = bcrypt.hashSync('123456', 10);
        db.run(`INSERT OR IGNORE INTO usuarios (username, nombre, apellido, email, password, is_admin) VALUES (?, ?, ?, ?, ?, ?)`, 
            ['admin', 'Admin', 'Admin', 'admin@example.com', adminPassword, 1]);
    }
});

// Middleware para verificar autenticación
const requireLogin = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.status(401).json({ error: 'Debe iniciar sesión' });
        } else {
            res.redirect('/index.html');
        }
    }
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
};

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM usuarios WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        req.session.userId = user.id;
        req.session.isAdmin = user.is_admin === 1;
        res.json({ success: true, isAdmin: user.is_admin === 1 });
    });
});

app.post('/registro', (req, res) => {
    const { username, nombre, apellido, email, password } = req.body;
    
    // Validar que todos los campos estén presentes
    if (!username || !nombre || !apellido || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run('INSERT INTO usuarios (username, nombre, apellido, email, password) VALUES (?, ?, ?, ?, ?)', 
        [username, nombre, apellido, email, hashedPassword], 
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed: usuarios.username')) {
                    return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
                }
                if (err.message.includes('UNIQUE constraint failed: usuarios.email')) {
                    return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
                }
                console.error('Error en el registro:', err);
                return res.status(500).json({ error: 'Error al crear el usuario' });
            }
            res.json({ success: true });
        });
});

// Rutas protegidas
app.get('/eventos', requireLogin, (req, res) => {
    db.all('SELECT * FROM eventos ORDER BY fecha DESC, hora ASC', [], (err, eventos) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(eventos);
    });
});

app.post('/eventos', requireLogin, requireAdmin, upload.single('eventImage'), (req, res) => {
    console.log('Cuerpo de la solicitud:', req.body);
    console.log('Archivo recibido:', req.file);

    const { titulo, descripcion, fecha, hora, lugar } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!titulo || !descripcion || !fecha || !hora || !lugar) {
        console.log('Campos faltantes:', {
            titulo: !!titulo,
            descripcion: !!descripcion,
            fecha: !!fecha,
            hora: !!hora,
            lugar: !!lugar
        });
        return res.status(400).json({ error: 'Todos los campos son requeridos excepto la imagen' });
    }

    // Determinar la ruta de la imagen
    let imagenPath = 'https://i.ibb.co/RgPTxQk/default.jpg'; // imagen por defecto
    if (req.file) {
        imagenPath = '/uploads/' + req.file.filename;
    }

    // Insertar el evento en la base de datos
    db.run(
        'INSERT INTO eventos (titulo, descripcion, fecha, hora, lugar, imagen, creador_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [titulo, descripcion, fecha, hora, lugar, imagenPath, req.session.userId],
        function(err) {
            if (err) {
                console.error('Error al crear evento:', err);
                return res.status(500).json({ error: 'Error al crear el evento en la base de datos' });
            }
            
            // Devolver el evento creado
            db.get('SELECT * FROM eventos WHERE id = ?', [this.lastID], (err, evento) => {
                if (err) {
                    console.error('Error al recuperar el evento creado:', err);
                    return res.status(500).json({ error: 'Error al recuperar el evento creado' });
                }
                res.status(201).json(evento);
            });
        }
    );
});

app.delete('/eventos/:id', requireLogin, requireAdmin, (req, res) => {
    const eventId = req.params.id;
    
    db.run('DELETE FROM eventos WHERE id = ?', [eventId], function(err) {
        if (err) {
            console.error('Error al eliminar el evento:', err);
            return res.status(500).json({ error: 'Error al eliminar el evento' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json({ success: true });
    });
});

// Ruta para unirse a un evento
app.post('/eventos/:id/join', requireLogin, (req, res) => {
    const eventoId = req.params.id;
    const usuarioId = req.session.userId;

    // Primero verificar si el evento existe
    db.get('SELECT * FROM eventos WHERE id = ?', [eventoId], (err, evento) => {
        if (err) {
            console.error('Error al verificar evento:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        if (!evento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Intentar inscribir al usuario en el evento
        db.run('INSERT INTO eventos_usuarios (evento_id, usuario_id) VALUES (?, ?)',
            [eventoId, usuarioId],
            function(err) {
                if (err) {
                    console.error('Error al inscribir usuario:', err);
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Ya estás inscrito en este evento' });
                    }
                    return res.status(500).json({ error: 'Error al unirse al evento' });
                }
                res.json({ success: true, message: 'Te has unido al evento exitosamente' });
            });
    });
});

// Ruta para obtener los eventos a los que se ha unido un usuario
app.get('/mis-eventos', requireLogin, (req, res) => {
    const usuarioId = req.session.userId;
    
    db.all(`
        SELECT e.* 
        FROM eventos e
        INNER JOIN eventos_usuarios eu ON e.id = eu.evento_id
        WHERE eu.usuario_id = ?
        ORDER BY e.fecha DESC, e.hora ASC
    `, [usuarioId], (err, eventos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar los eventos' });
        }
        res.json(eventos);
    });
});

// Ruta para verificar si un usuario está inscrito en un evento
app.get('/eventos/:id/inscrito', requireLogin, (req, res) => {
    const eventoId = req.params.id;
    const usuarioId = req.session.userId;

    db.get('SELECT * FROM eventos_usuarios WHERE evento_id = ? AND usuario_id = ?', 
        [eventoId, usuarioId], 
        (err, inscripcion) => {
            if (err) {
                console.error('Error al verificar inscripción:', err);
                return res.status(500).json({ error: 'Error al verificar inscripción' });
            }
            res.json({ inscrito: !!inscripcion });
        });
});

// Ruta para abandonar un evento
app.delete('/eventos/:id/join', requireLogin, (req, res) => {
    const eventoId = req.params.id;
    const usuarioId = req.session.userId;

    db.run('DELETE FROM eventos_usuarios WHERE evento_id = ? AND usuario_id = ?',
        [eventoId, usuarioId],
        function(err) {
            if (err) {
                console.error('Error al abandonar evento:', err);
                return res.status(500).json({ error: 'Error al abandonar el evento' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'No estabas inscrito en este evento' });
            }
            res.json({ success: true, message: 'Has abandonado el evento exitosamente' });
        });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Ruta temporal para ver usuarios (eliminar en producción)
app.get('/check-users', requireLogin, requireAdmin, (req, res) => {
    db.all("SELECT id, username, nombre, apellido, email, is_admin FROM usuarios", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log('Servidor iniciado exitosamente');
});
