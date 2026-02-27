'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import { apiRequest } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth-client';

export default function StudentsPage() {
  const auth = useAuthGuard();
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadStudents() {
    const response = await apiRequest('/students', { token: auth.token });
    if (!response.ok) {
      setError(response.data?.error || 'Unable to load students');
      return;
    }

    setStudents(response.data);
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadStudents();
  }, [auth.ready]);

  async function createStudent(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const response = await apiRequest('/students', {
      method: 'POST',
      token: auth.token,
      body: {
        name,
        grade: grade || null,
      },
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to create student');
      return;
    }

    setName('');
    setGrade('');
    setMessage('Student created.');
    loadStudents();
  }

  async function saveStudent(studentId) {
    setError('');
    setMessage('');

    const response = await apiRequest(`/students/${studentId}`, {
      method: 'PATCH',
      token: auth.token,
      body: {
        name: editName,
        grade: editGrade || null,
      },
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to update student');
      return;
    }

    setEditingId(null);
    setMessage('Student updated.');
    loadStudents();
  }

  async function removeStudent(studentId) {
    setError('');
    setMessage('');

    const response = await apiRequest(`/students/${studentId}`, {
      method: 'DELETE',
      token: auth.token,
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to delete student');
      return;
    }

    setMessage('Student deleted.');
    loadStudents();
  }

  if (!auth.ready) return <LoadingState text="Loading students..." />;

  return (
    <AppShell title="Students" user={auth.user} plan={auth.plan} token={auth.token}>
      <div className="card form-grid">
        <h2 className="card-title">Create Student Profile</h2>
        <form className="two-col" onSubmit={createStudent}>
          <label>
            Student name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Grade
            <input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="Year 5 / Year 6"
            />
          </label>
          <div className="btn-row">
            <button className="primary-btn" type="submit">Create</button>
          </div>
        </form>
        {error ? <div className="error-box">{error}</div> : null}
        {message ? <div className="ok-box">{message}</div> : null}
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Student List</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isEditing = editingId === student.id;
                return (
                  <tr key={student.id}>
                    <td>
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                        />
                      ) : (
                        student.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          value={editGrade}
                          onChange={(event) => setEditGrade(event.target.value)}
                        />
                      ) : (
                        student.grade || '-'
                      )}
                    </td>
                    <td>{student.created_at?.slice(0, 10) || '-'}</td>
                    <td>
                      <div className="form-grid" style={{ gap: 8 }}>
                        <div className="btn-row">
                          <Link className="primary-btn" href={`/students/${student.id}/reports/new`}>Quick Analyze</Link>
                          <Link className="secondary-btn" href={`/students/${student.id}/diagnosis`}>Diagnosis</Link>
                          <Link className="secondary-btn" href={`/students/${student.id}/reports`}>Report History</Link>
                        </div>
                        <div className="btn-row">
                          <Link className="secondary-btn" href={`/students/${student.id}/prescriptions`}>Prescriptions</Link>
                          <Link className="secondary-btn" href={`/students/${student.id}/progress`}>Progress</Link>
                        </div>
                        <div className="btn-row">
                        {!isEditing ? (
                          <button
                            className="secondary-btn"
                            onClick={() => {
                              setEditingId(student.id);
                              setEditName(student.name);
                              setEditGrade(student.grade || '');
                            }}
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            <button className="primary-btn" onClick={() => saveStudent(student.id)}>Save</button>
                            <button className="secondary-btn" onClick={() => setEditingId(null)}>Cancel</button>
                          </>
                        )}
                        <button className="danger-btn" onClick={() => removeStudent(student.id)}>Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
