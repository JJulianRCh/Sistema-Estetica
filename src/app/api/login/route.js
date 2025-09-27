import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import sanitize from 'mongo-sanitize'; // Para sanitizar los valores

const loginIntentos = {}; // Para rastrear intentos de login por IP

const MAX_INTENTOS = 5;
const BLOQUEO_TIEMPO = 15 * 60 * 1000; // 15 minutos

function registrarIntento(ip) {
  if (!loginIntentos[ip]) {
    loginIntentos[ip] = { intentos: 0, bloqueadoHasta: null };
  }
  loginIntentos[ip].intentos += 1;
}

function estaBloqueado(ip) {
  const intento = loginIntentos[ip];
  if (intento) {
    if (intento.bloqueadoHasta && intento.bloqueadoHasta > Date.now()) {
      return true;
    }
    if (intento.intentos >= MAX_INTENTOS) {
      intento.bloqueadoHasta = Date.now() + BLOQUEO_TIEMPO;
      intento.intentos = 0;
      return true;
    }
    return false;
  }
  return false;
}

export async function POST(request) {
  try {

    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';

    if (estaBloqueado(ip)) {
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const client = await clientPromise;
    const db = client.db('estetica-citas');
    
    //const { email, password } = await request.json();

    const body = await request.json();

    // Sanitizamos los valores para evitar inyecciones
    const email = sanitize(body.email);
    const password = sanitize(body.password);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    if (
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    let user = await db.collection('users').findOne({ email });
    let isAdmin = false;

    if (!user) {
      user = await db.collection('admins').findOne({ email });
      isAdmin = true;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      registrarIntento(ip);
      return NextResponse.json(
        { success: false, message: 'Contraseña incorrecta' },
        { status: 400 }
      );
    }

    // Login exitoso, reseteamos los intentos
    if (loginIntentos[ip]) {
      delete loginIntentos[ip];
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'mi-secreto-estetica-citas-2024',
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido || '',
        email: user.email,
        telefono: user.telefono || '',
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    );
  }
}
