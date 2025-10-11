import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ContactsSection = ({ studentId }) => {
  const [acceptedTeachers, setAcceptedTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcceptedTeachers = async () => {
      try {
        const response = await apiService.students.getAcceptedTeachers();
        const teachers = response.data;
        setAcceptedTeachers(teachers);
      } catch (error) {
        console.error('Error fetching accepted teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAcceptedTeachers();
    }
  }, [studentId]);

  if (loading) return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
        </svg>
        My Teachers
      </h3>
      {acceptedTeachers.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-gray-500">No teachers connected yet</p>
          <p className="text-sm text-gray-400 mt-1">Send requests to teachers to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {acceptedTeachers.map(teacher => (
            <div key={teacher.teacherId} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold text-sm">
                  {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{teacher.fullName}</h4>
                <p className="text-sm text-gray-600">{teacher.email}</p>
              </div>
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsSection;