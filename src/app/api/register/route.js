import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sanitize } from 'mongo-sanitize'; // Para sanitizar los valores

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('estetica-citas');
    
    //const { nombre, apellido, email, telefono, password } = await request.json();
    const body = await request.json();

    // Sanitizamos los valores para evitar inyecciones
    const nombre = sanitize(body.nombre);
    const apellido = sanitize(body.apellido);
    const email = sanitize(body.email);
    const telefono = sanitize(body.telefono);
    const password = sanitize(body.password);


    /*
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nombre, email y contraseña son obligatorios' },
        { status: 400 }
      );
    }
    */

    // Se validan que los datos cumplan con los requisitos mínimos
    if (
      typeof nombre !== 'string' || !/^[a-zA-ZÀ-ÿ\s]{2,}$/.test(nombre)
      || typeof apellido !== 'string' || (apellido && !/^[a-zA-ZÀ-ÿ\s]{2,}$/.test(apellido))
      || typeof telefono !== 'string' || (telefono && !/^\+?[0-9\s\-]{7,15}$/.test(telefono))
      || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof password !== 'string'
    ) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos o incompletos' },
        { status: 400 }
      );
    }

    // Se aumento el minimo de 6 a 8 caracteres para mayor seguridad
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12); // 12 rondas de salt en vez de 10
    
    const newUser = {
      nombre,
      apellido: apellido || '',
      email,
      telefono: telefono || '',
      password: hashedPassword,
      fechaRegistro: new Date(),
      rol: 'cliente'
    };

    const result = await db.collection('users').insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: 'Cliente registrado para citas',
      user: { 
        id: result.insertedId, 
        nombre: newUser.nombre, 
        email: newUser.email 
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    );
  }
}