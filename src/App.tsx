import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FilePreviewModal, type PreviewFile } from './components/FilePreviewModal';
import { FolderIllustration } from './components/FolderIllustration';
import { FileIllustration } from './components/FileIllustration';
import { RecommendationView } from './components/RecommendationView';
import { getPdfFromDisk, getTextFromDisk, savePdfToDisk, saveTextToDisk } from './services/academicCache';

// Type definitions for Recursive JSON Tree
interface FileItem {
  name: string;
  size: string;
  type: string;
  url: string;
}

interface FolderItem {
  name: string;
  folders?: FolderItem[];
  files?: FileItem[];
}

interface CourseItem {
  code: string;
  title: string;
  instructor: string;
  room: string;
  tint: string;
  accent: string;
  doodle: string;
  folders: FolderItem[];
  files?: FileItem[];
}

interface TimetableSlot {
  time: string;
  code: string;
  title: string;
  room: string;
  instructor: string;
  status?: 'completed' | 'live' | 'next' | 'upcoming';
}

interface SemesterData {
  semester: string;
  section: string;
  campus: string;
  timetable: {
    [key: string]: TimetableSlot[];
  };
  courses: CourseItem[];
}

// Fallback initial state matching semester.json exactly
const INITIAL_DATA: SemesterData = {
  semester: 'Fall 2026',
  section: 'BSCS Green',
  campus: 'PAF-IAST',
  timetable: {
    monday: [
      {
        time: '09:00 - 11:30',
        code: 'COMP-105L',
        title: 'Fundamentals of ICT Lab',
        room: 'C2-2CL',
        instructor: 'Mr. Abdul Moiz',
      },
      {
        time: '12:30 - 14:00',
        code: 'HUM-101',
        title: 'English Language & Communication Skills',
        room: 'A1-304.4',
        instructor: 'Mr. Sabir Shah',
      },
      {
        time: '14:00 - 15:30',
        code: 'HUM-101',
        title: 'English Language & Communication Skills',
        room: 'A1-304.4',
        instructor: 'Mr. Sabir Shah',
      },
      {
        time: '15:30 - 17:00',
        code: 'COMP-111',
        title: 'Programming Fundamentals',
        room: 'A1-304.1',
        instructor: 'Dr. Farooq Ali',
      },
    ],
    tuesday: [
      {
        time: '11:30 - 14:00',
        code: 'COMP-111L',
        title: 'Programming Fundamentals Lab',
        room: 'C2-5CL',
        instructor: 'Ms. Faiza Bukhari',
      },
    ],
    wednesday: [
      {
        time: '09:00 - 10:30',
        code: 'MATH-101',
        title: 'Foundation Mathematics-1',
        room: 'C1-B01',
        instructor: 'Ms. Aneela Bibi',
      },
      {
        time: '11:00 - 12:00',
        code: 'COMP-105',
        title: 'Fundamentals of ICT',
        room: 'A1-306.1',
        instructor: 'Ms. Iqra Kanwal',
      },
      {
        time: '12:00 - 12:30',
        code: 'SS-112',
        title: 'Islamic Studies',
        room: 'Online 4',
        instructor: 'Dr. Ahmed Abdullah',
      },
      {
        time: '16:00 - 17:00',
        code: 'SS-113',
        title: 'Pakistan Studies',
        room: 'Online 8',
        instructor: 'Dr. Touqeer Akhtar Nasir',
      },
    ],
    thursday: [
      {
        time: '09:00 - 11:00',
        code: 'SS-111',
        title: 'Understanding of Quran-I',
        room: 'A1-307 (LT)',
        instructor: 'Dr. Waqas Ahmed',
      },
      {
        time: '11:30 - 14:00',
        code: 'PHY-101L',
        title: 'Applied Physics Lab',
        room: 'A1-301 Phy(Lab)',
        instructor: 'Mr. Behzad Gull',
      },
      {
        time: '14:00 - 15:30',
        code: 'PHY-101',
        title: 'Applied Physics',
        room: 'A1-304.1',
        instructor: 'Dr. Anique Ahmed',
      },
    ],
    friday: [
      {
        time: '09:00 - 10:30',
        code: 'PHY-101',
        title: 'Applied Physics',
        room: 'A1-304.1',
        instructor: 'Dr. Anique Ahmed',
      },
      {
        time: '10:30 - 12:00',
        code: 'COMP-111',
        title: 'Programming Fundamentals',
        room: 'A2-105',
        instructor: 'Dr. Farooq Ali',
      },
      {
        time: '15:30 - 17:00',
        code: 'MATH-101',
        title: 'Foundation Mathematics-1',
        room: 'C1-B07',
        instructor: 'Ms. Aneela Bibi',
      },
    ],
  },
  courses: [
    {
      code: 'PHY-101',
      title: 'Applied Physics',
      instructor: 'Dr. Anique Ahmed',
      room: 'A1-304.1',
      tint: '#FFF5F5',
      accent: '#E53935',
      doodle: 'PHY-101',
      folders: [
        {
          name: 'Lecture Slide Decks',
          folders: [
            {
              name: 'Week 01 - Optics & Fundamentals',
              files: [
                { name: 'Lecture1_Ph101_Fall2026.pdf', size: '3.8 MB', type: 'pdf', url: '#' },
                { name: 'Applied_Physics_Course_Card.pdf', size: '420 KB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Week 02 - Wave Dynamics',
              files: [
                { name: 'Lecture2_Ph101_Fall2026.pdf', size: '4.1 MB', type: 'pdf', url: '#' },
                { name: 'Lecture3_Ph101.pdf', size: '3.2 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Week 03 & 04 - Electromagnetic Waves',
              files: [
                { name: 'Lecture4_Ph101_Fall2026.pdf', size: '4.5 MB', type: 'pdf', url: '#' },
                { name: 'Lecture5_Ph101_Fall2026.pdf', size: '5.1 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Reference Textbooks',
          files: [
            { name: 'Fundamentals of Physics (10th Edition).pdf', size: '32.4 MB', type: 'pdf', url: '#' },
            { name: 'Physics for Engineers & Scientists.pdf', size: '28.1 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'PHY-101L',
      title: 'Applied Physics Lab',
      instructor: 'Mr. Behzad Gull',
      room: 'A1-301 Phy(Lab)',
      tint: '#FFF0F0',
      accent: '#D32F2F',
      doodle: 'PHY-101L',
      folders: [
        {
          name: 'Lab Manuals & Protocols',
          folders: [
            {
              name: 'Experiments 01 - 03 (Mechanics)',
              files: [
                { name: 'Exp01_Vernier_Caliper_Micrometer.pdf', size: '1.2 MB', type: 'pdf', url: '#' },
                { name: 'Exp02_Simple_Pendulum_Gravity.pdf', size: '1.4 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Experiments 04 - 06 (Optics & Refraction)',
              files: [
                { name: 'Exp04_Snells_Law_Prism.pdf', size: '2.1 MB', type: 'pdf', url: '#' },
                { name: 'Exp05_Focal_Length_Lenses.pdf', size: '1.8 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Safety & Report Templates',
          files: [
            { name: 'Physics_Laboratory_Safety_Protocol.pdf', size: '540 KB', type: 'pdf', url: '#' },
            { name: 'Physics_Lab_Report_Template.docx', size: '320 KB', type: 'docx', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'COMP-111',
      title: 'Programming Fundamentals',
      instructor: 'Dr. Farooq Ali',
      room: 'A1-304.1',
      tint: '#F0F7FF',
      accent: '#1E88E5',
      doodle: 'COMP-111',
      folders: [
        {
          name: 'Lecture Slide Decks',
          folders: [
            {
              name: 'Module 01 - C++ Basics & Compilation Process',
              files: [
                { name: 'PF_Lecture_01_Intro_CPP.pptx', size: '2.9 MB', type: 'pptx', url: '#' },
                { name: 'PF_Lecture_02_IOStreams_Variables.pptx', size: '3.5 MB', type: 'pptx', url: '#' },
              ],
            },
            {
              name: 'Module 02 - Functions, References & Pointers',
              files: [
                { name: 'Lecture_4_Control_Structures.pdf', size: '1.8 MB', type: 'pdf', url: '#' },
                { name: 'Pointers_and_References_Handout.pdf', size: '2.2 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Reference Guides & Starters',
          files: [
            { name: 'Cplusplus_Standard_Reference_Guide.pdf', size: '1.4 MB', type: 'pdf', url: '#' },
            { name: 'Lab_01_Gplusplus_Setup.pdf', size: '650 KB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'COMP-111L',
      title: 'Programming Fundamentals Lab',
      instructor: 'Ms. Faiza Bukhari',
      room: 'C2-5CL',
      tint: '#E8F4FD',
      accent: '#0288D1',
      doodle: 'COMP-111L',
      folders: [
        {
          name: 'Weekly C++ Lab Handouts',
          folders: [
            {
              name: 'Weeks 01 - 04 (CLI, I/O & Loops)',
              files: [
                { name: 'Lab01_Gplusplus_Toolchain_Guide.pdf', size: '890 KB', type: 'pdf', url: '#' },
                { name: 'Lab02_Conditionals_Nested_Loops.pdf', size: '1.1 MB', type: 'pdf', url: '#' },
                { name: 'Lab03_Modular_Functions_References.pdf', size: '1.3 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Weeks 05 - 08 (Arrays, Pointers & dynamic memory)',
              files: [
                { name: 'Lab04_Pointers_and_Arrays.pdf', size: '1.5 MB', type: 'pdf', url: '#' },
                { name: 'Lab05_Dynamic_Memory_new_delete.pdf', size: '1.2 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'C++ Starters & Templates',
          files: [
            { name: 'main_starter.cpp', size: '15 KB', type: 'cpp', url: '#' },
            { name: 'lab_workspace_setup.zip', size: '2.4 MB', type: 'zip', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'COMP-105',
      title: 'Fundamentals of ICT',
      instructor: 'Ms. Iqra Kanwal',
      room: 'A1-306.1',
      tint: '#FFF8F2',
      accent: '#FF6D00',
      doodle: 'COMP-105',
      folders: [
        {
          name: 'Lecture Slides',
          folders: [
            {
              name: 'Unit 1 - Computer Architecture',
              files: [
                { name: 'ICT_Lecture_01_Hardware.pdf', size: '3.1 MB', type: 'pdf', url: '#' },
                { name: 'ICT_Lecture_02_Memory_Storage.pdf', size: '2.8 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Unit 2 - TCP/IP Networking',
              files: [
                { name: 'ICT_Lecture_04_Networking.pdf', size: '4.2 MB', type: 'pdf', url: '#' },
                { name: 'ICT_Lecture_05_Internet_Protocols.pdf', size: '3.9 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Reference Notes',
          files: [
            { name: 'Binary_Logic_Gates_Overview.pdf', size: '1.9 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'COMP-105L',
      title: 'Fundamentals of ICT Lab',
      instructor: 'Mr. Abdul Moiz',
      room: 'C2-2CL',
      tint: '#FFF3E0',
      accent: '#F57C00',
      doodle: 'COMP-105L',
      folders: [
        {
          name: 'Hands-on Lab Exercises',
          folders: [
            {
              name: 'Hardware & Cable Termination',
              files: [
                { name: 'Lab01_Hardware_Teardown.pdf', size: '2.3 MB', type: 'pdf', url: '#' },
                { name: 'Lab02_Cat6_RJ45_Crimping_Guide.pdf', size: '3.4 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Cisco Packet Tracer Subnets',
              files: [
                { name: 'Lab03_Subnetting_VLAN_Config.pdf', size: '2.1 MB', type: 'pdf', url: '#' },
                { name: 'Campus_Subnet_Topology.pkt', size: '840 KB', type: 'pkt', url: '#' },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'MATH-101',
      title: 'Foundation Mathematics-1',
      instructor: 'Ms. Aneela Bibi',
      room: 'C1-B01',
      tint: '#F5F3FF',
      accent: '#7C3AED',
      doodle: 'MATH-101',
      folders: [
        {
          name: 'Lecture Notes & Problem Sets',
          folders: [
            {
              name: 'Chapter 01 - Functions & Inequalities',
              files: [
                { name: 'Math101_Functions_Domain_Range.pdf', size: '2.4 MB', type: 'pdf', url: '#' },
                { name: 'Problem_Set_01_Solutions.pdf', size: '1.8 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Chapter 02 - Limits & Continuity',
              files: [
                { name: 'Math101_Limits_Squeeze_Theorem.pdf', size: '2.9 MB', type: 'pdf', url: '#' },
                { name: 'Continuity_Theorems_Handout.pdf', size: '1.5 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Chapter 03 - Differential Calculus',
              files: [
                { name: 'Derivatives_Chain_Rule_Examples.pdf', size: '3.1 MB', type: 'pdf', url: '#' },
                { name: 'Implicit_Differentiation_Worksheet.pdf', size: '1.7 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Reference Textbooks',
          files: [
            { name: 'Calculus_Early_Transcendentals_Anton.pdf', size: '44.2 MB', type: 'pdf', url: '#' },
            { name: 'Precalculus_Review_Formula_Sheet.pdf', size: '820 KB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'HUM-101',
      title: 'English Language & Communication Skills',
      instructor: 'Mr. Sabir Shah',
      room: 'A1-304.4',
      tint: '#F0FDF4',
      accent: '#059669',
      doodle: 'HUM-101',
      folders: [
        {
          name: 'Course Modules & Reading Materials',
          folders: [
            {
              name: 'Module 01 - Academic Writing',
              files: [
                { name: 'Paragraph_Structure_and_Coherence.pdf', size: '1.6 MB', type: 'pdf', url: '#' },
                { name: 'Formal_Email_and_Memo_Etiquette.pdf', size: '1.1 MB', type: 'pdf', url: '#' },
              ],
            },
            {
              name: 'Module 02 - Public Speaking & Presentations',
              files: [
                { name: 'Oral_Presentation_Rubric.pdf', size: '920 KB', type: 'pdf', url: '#' },
                { name: 'Active_Listening_Strategies.pdf', size: '1.4 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Writing Guides & Citation Styles',
          files: [
            { name: 'APA_7th_Edition_Quick_Guide.pdf', size: '1.3 MB', type: 'pdf', url: '#' },
            { name: 'Academic_Vocabulary_Handbook.pdf', size: '2.2 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'SS-111',
      title: 'Understanding of Quran-I',
      instructor: 'Dr. Waqas Ahmed',
      room: 'A1-307 (LT)',
      tint: '#ECFDF5',
      accent: '#15803D',
      doodle: 'SS-111',
      folders: [
        {
          name: 'Surah Studies & Commentary',
          folders: [
            {
              name: 'Selected Verses & Vocabulary',
              files: [
                { name: 'Surah_Al_Hujurat_Selected_Study.pdf', size: '2.7 MB', type: 'pdf', url: '#' },
                { name: 'Quranic_Arabic_Vocabulary_Glossary.pdf', size: '3.1 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Course Curriculum & Reader',
          files: [
            { name: 'Understanding_Quran_Syllabus_Fall2026.pdf', size: '890 KB', type: 'pdf', url: '#' },
            { name: 'Tafseer_Principles_and_Methodology.pdf', size: '4.2 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'SS-112',
      title: 'Islamic Studies',
      instructor: 'Dr. Ahmed Abdullah',
      room: 'Online 4',
      tint: '#F0FDF4',
      accent: '#047857',
      doodle: 'SS-112',
      folders: [
        {
          name: 'Assigned Readings & Moral Philosophy',
          folders: [
            {
              name: 'Core Ethical Themes',
              files: [
                { name: 'Seerat_un_Nabi_Governance_Ethics.pdf', size: '3.6 MB', type: 'pdf', url: '#' },
                { name: 'Islamic_Economic_Foundations_Digest.pdf', size: '2.5 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Reference Notes',
          files: [
            { name: 'Islamic_Studies_Curriculum_Reader.pdf', size: '5.1 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
    {
      code: 'SS-113',
      title: 'Pakistan Studies',
      instructor: 'Dr. Touqeer Akhtar Nasir',
      room: 'Online 8',
      tint: '#F8FAFC',
      accent: '#334155',
      doodle: 'SS-113',
      folders: [
        {
          name: 'Historical & Constitutional Documents',
          folders: [
            {
              name: 'Constitutional Milestones',
              files: [
                { name: 'Constitutional_History_1973.pdf', size: '4.7 MB', type: 'pdf', url: '#' },
                { name: 'Lahore_Resolution_1940_Context.pdf', size: '1.9 MB', type: 'pdf', url: '#' },
              ],
            },
          ],
        },
        {
          name: 'Geography & Economy',
          files: [
            { name: 'Socioeconomic_Geography_Pakistan.pdf', size: '3.3 MB', type: 'pdf', url: '#' },
            { name: 'Foreign_Policy_and_GeoStrategy.pdf', size: '2.8 MB', type: 'pdf', url: '#' },
          ],
        },
      ],
    },
  ],
};

// Hand-Drawn Slate Doodles as Subject Logos with Interactive Hover Animations
function CourseDoodle({ code }: { code: string }) {
  if (code === 'PHY-101') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Central Atomic Nucleus - Pulses on hover */}
        <g
          className="transition-transform duration-300 ease-out group-hover:scale-125"
          style={{ transformOrigin: '28px 22px' }}
        >
          <circle cx="28" cy="22" r="5" fill="#E53935" />
          <circle cx="26" cy="20" r="1.5" fill="#FFFFFF" opacity="0.7" />
        </g>
        {/* Elliptical Electron Orbits - Spin on hover */}
        <g
          className="transition-transform duration-500 ease-out group-hover:rotate-45"
          style={{ transformOrigin: '28px 22px' }}
        >
          <ellipse cx="28" cy="22" rx="20" ry="7.5" stroke="#141414" strokeWidth="1.5" transform="rotate(-30 28 22)" />
          <circle cx="43" cy="14" r="2" fill="#1E88E5" className="transition-transform duration-300 group-hover:scale-125" />
        </g>
        <g
          className="transition-transform duration-500 ease-out group-hover:-rotate-45"
          style={{ transformOrigin: '28px 22px' }}
        >
          <ellipse cx="28" cy="22" rx="20" ry="7.5" stroke="#141414" strokeWidth="1.5" transform="rotate(30 28 22)" />
          <circle cx="13" cy="30" r="2" fill="#FF6D00" className="transition-transform duration-300 group-hover:scale-125" />
          <circle cx="36" cy="33" r="2" fill="#1E88E5" className="transition-transform duration-300 group-hover:scale-125" />
        </g>
        {/* Slate inspecting with magnifying glass - Perks up and leans in */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:rotate-2 origin-bottom">
          <rect x="68" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="78" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="71" y1="35" x2="69" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="79" y1="35" x2="81" y2="43" stroke="#141414" strokeWidth="1.6" />
          {/* Arm holding magnifying glass - Zooms closer to the atom */}
          <g
            className="transition-transform duration-300 ease-out group-hover:-translate-x-1.5 group-hover:scale-110"
            style={{ transformOrigin: '51px 22px' }}
          >
            <path d="M68 25 Q58 26 53 23" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="51" cy="22" r="4.5" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
            <line x1="49" y1="25" x2="46" y2="28" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    );
  }
  if (code === 'PHY-101L') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Lab Clamp Stand */}
        <line x1="8" y1="39" x2="24" y2="39" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="39" x2="14" y2="8" stroke="#141414" strokeWidth="1.6" />
        <line x1="14" y1="9" x2="29" y2="9" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
        {/* Hanging Pendulum with motion arc - Swings energetically on hover */}
        <g
          className="transition-transform duration-300 ease-in-out group-hover:rotate-25"
          style={{ transformOrigin: '28px 9px' }}
        >
          <line x1="28" y1="9" x2="21" y2="28" stroke="#141414" strokeWidth="1.2" />
          <circle cx="20" cy="30" r="3" fill="#D32F2F" stroke="#141414" strokeWidth="1.2" />
        </g>
        <path d="M15 32 Q20 34 26 31" stroke="#D32F2F" strokeWidth="1.2" strokeDasharray="2 1.5" />

        {/* Horseshoe Magnet (Electromagnetism) - Jumps/vibrates on hover */}
        <g
          className="transition-transform duration-200 ease-out group-hover:-translate-y-1"
          style={{ transformOrigin: '42px 25px' }}
        >
          <path d="M37 17 V27 C37 33 47 33 47 27 V17" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M37 17 V21" stroke="#D32F2F" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M47 17 V21" stroke="#1E88E5" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M37 14 Q42 10 47 14"
            stroke="#D32F2F"
            strokeWidth="1"
            strokeDasharray="2 1"
            fill="none"
            className="transition-all duration-300 group-hover:scale-125"
            style={{ transformOrigin: '42px 14px' }}
          />
        </g>

        {/* Slate holding a stopwatch - Leans forward intently */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="68" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="78" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="71" y1="35" x2="69" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="79" y1="35" x2="81" y2="43" stroke="#141414" strokeWidth="1.6" />
          {/* Arm reaching out holding stopwatch - Stopwatch ticks on hover */}
          <path d="M68 25 L58 24" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          <g
            className="transition-transform duration-200 group-hover:scale-110"
            style={{ transformOrigin: '55px 24px' }}
          >
            <circle cx="55" cy="24" r="4" fill="#FFFFFF" stroke="#141414" strokeWidth="1.3" />
            <line x1="55" y1="20" x2="55" y2="18.5" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />
            <line
              x1="55"
              y1="24"
              x2="56.5"
              y2="22.5"
              stroke="#D32F2F"
              strokeWidth="1.1"
              strokeLinecap="round"
              className="transition-transform duration-300 group-hover:rotate-90"
              style={{ transformOrigin: '55px 24px' }}
            />
          </g>
        </g>
      </svg>
    );
  }
  if (code === 'COMP-111') {
    return (
      <svg viewBox="0 0 110 45" className="w-26 h-10 shrink-0 overflow-visible" fill="none">
        {/* Robot Head & Body - Drives forward slightly on hover */}
        <g className="transition-transform duration-300 ease-out group-hover:translate-x-1.5">
          <rect x="13" y="15" width="22" height="18" rx="4" stroke="#141414" strokeWidth="1.6" fill="#FFFFFF" />
          {/* Antenna - Pulses with glowing cyan tip */}
          <line x1="24" y1="15" x2="24" y2="8" stroke="#141414" strokeWidth="1.5" />
          <circle
            cx="24"
            cy="7"
            r="2.2"
            fill="#1E88E5"
            stroke="#141414"
            strokeWidth="1"
            className="transition-all duration-200 group-hover:fill-[#38BDF8] group-hover:scale-125"
            style={{ transformOrigin: '24px 7px' }}
          />
          {/* Robot Visor Screen */}
          <rect x="16" y="18" width="16" height="7" rx="2" fill="#141414" />
          <circle cx="20" cy="21.5" r="1.3" fill="#38BDF8" className="transition-transform duration-200 group-hover:scale-125" style={{ transformOrigin: '20px 21.5px' }} />
          <circle cx="28" cy="21.5" r="1.3" fill="#38BDF8" className="transition-transform duration-200 group-hover:scale-125" style={{ transformOrigin: '28px 21.5px' }} />
          {/* Robot Gripper Arm */}
          <path
            d="M13 24 L7 21 L5 25"
            stroke="#141414"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:rotate-12"
            style={{ transformOrigin: '13px 24px' }}
          />
          {/* Robot Wheel Base */}
          <rect x="12" y="33" width="24" height="6" rx="3" stroke="#141414" strokeWidth="1.4" fill="#F1F5F9" />
          <circle cx="17" cy="36" r="1.5" fill="#141414" />
          <circle cx="31" cy="36" r="1.5" fill="#141414" />
        </g>

        {/* Wireless Signal Waves - Expands and ripples on hover */}
        <path
          d="M39 21 Q44 24 49 21"
          stroke="#1E88E5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 1.5"
          fill="none"
          className="transition-transform duration-300 ease-out group-hover:scale-125 group-hover:translate-x-1"
          style={{ transformOrigin: '44px 21px' }}
        />

        {/* Slate Holding Remote Control - Bobs up on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="72" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="76" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="82" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="75" y1="35" x2="73" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="83" y1="35" x2="85" y2="43" stroke="#141414" strokeWidth="1.6" />

          {/* Remote Controller */}
          <g
            className="transition-transform duration-200 group-hover:-rotate-6"
            style={{ transformOrigin: '60px 25px' }}
          >
            <rect x="54" y="21" width="13" height="9" rx="2" stroke="#141414" strokeWidth="1.3" fill="#FFFFFF" />
            <line x1="57" y1="21" x2="57" y2="16" stroke="#141414" strokeWidth="1.2" />
            <circle cx="57" cy="15.5" r="1.2" fill="#1E88E5" />
            <circle cx="60" cy="25.5" r="1.3" fill="#1E88E5" />
            <circle cx="64" cy="25.5" r="1.3" fill="#FF6D00" />
            <path d="M72 25 L67 25" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    );
  }
  if (code === 'COMP-111L') {
    return (
      <svg viewBox="0 0 110 45" className="w-26 h-10 shrink-0 overflow-visible" fill="none">
        {/* Desk Surface Ground Line */}
        <line x1="3" y1="39" x2="62" y2="39" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />

        {/* Terminal Monitor Casing - Glows on hover */}
        <g
          className="transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          style={{ transformOrigin: '28px 21px' }}
        >
          <rect
            x="4"
            y="8"
            width="48"
            height="26"
            rx="3"
            stroke="#141414"
            strokeWidth="1.6"
            fill="#0F172A"
            className="transition-colors duration-200 group-hover:stroke-[#38BDF8]"
          />
          <path d="M23 34 L21 39 L35 39 L33 34" stroke="#141414" strokeWidth="1.4" fill="#E2E8F0" />
          <line x1="4" y1="14" x2="52" y2="14" stroke="#334155" strokeWidth="1" />
          <circle cx="8.5" cy="11" r="1.1" fill="#EF4444" />
          <circle cx="12.5" cy="11" r="1.1" fill="#F59E0B" />
          <circle cx="16.5" cy="11" r="1.1" fill="#10B981" />

          {/* C++ Code Lines */}
          <text
            x="8"
            y="20.5"
            fill="#38BDF8"
            fontSize="4.8"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
            textLength="33"
            lengthAdjust="spacingAndGlyphs"
          >
            g++ main.cpp
          </text>
          <text
            x="8"
            y="27"
            fill="#4ADE80"
            fontSize="4.6"
            fontFamily="JetBrains Mono, monospace"
            textLength="30"
            lengthAdjust="spacingAndGlyphs"
          >
            cout &lt;&lt; "ok";
          </text>
        </g>

        {/* Keyboard on Desk */}
        <rect x="33" y="33" width="22" height="6" rx="1.5" stroke="#141414" strokeWidth="1.3" fill="#FFFFFF" />
        <line x1="36" y1="36" x2="52" y2="36" stroke="#94A3B8" strokeWidth="1" strokeDasharray="1.5 1.5" />

        {/* Slate Sitting at Desk Typing with Both Hands - Rapid typing movement */}
        <g className="transition-all duration-150 ease-out group-hover:-translate-y-1 origin-bottom">
          <rect x="62" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="66" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="65" y1="35" x2="63" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="73" y1="35" x2="75" y2="43" stroke="#141414" strokeWidth="1.6" />
          <path
            d="M62 24 Q55 27 50 33"
            stroke="#141414"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="transition-transform duration-100 group-hover:rotate-3"
            style={{ transformOrigin: '62px 24px' }}
          />
          <path
            d="M62 26 Q54 29 46 34"
            stroke="#141414"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="transition-transform duration-100 group-hover:-rotate-3"
            style={{ transformOrigin: '62px 26px' }}
          />
        </g>

        {/* C++ Developer Coffee Mug with Steam rising */}
        <g
          className="transition-transform duration-200 group-hover:scale-105"
          style={{ transformOrigin: '91px 32px' }}
        >
          <rect x="85" y="26" width="13" height="13" rx="2" stroke="#141414" strokeWidth="1.3" fill="#00599C" />
          <path d="M98 28 C101 28 101 37 98 37" stroke="#141414" strokeWidth="1.3" fill="none" />
          <text x="91.5" y="34.5" fill="#FFFFFF" fontSize="5.2" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">C++</text>
          <g className="transition-transform duration-300 ease-out group-hover:-translate-y-2">
            <path d="M88 22 Q90 20 88 18" stroke="#00599C" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M92 21 Q94 19 92 17" stroke="#00599C" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>
        </g>
      </svg>
    );
  }
  if (code === 'COMP-105') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* CPU Processor Die Package - Scales slightly on hover */}
        <g
          className="transition-transform duration-200 ease-out group-hover:scale-105"
          style={{ transformOrigin: '26px 22px' }}
        >
          <rect
            x="12"
            y="10"
            width="28"
            height="25"
            rx="3"
            stroke="#141414"
            strokeWidth="1.6"
            fill="#FFFFFF"
            className="transition-colors duration-200 group-hover:stroke-[#FF6D00]"
          />
          <rect x="17" y="15" width="18" height="15" rx="1.5" fill="#FFF7ED" stroke="#FF6D00" strokeWidth="1" />
          <text x="26" y="25" fill="#FF6D00" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">CPU</text>

          {/* Dual Inline Pins (Left) */}
          <line x1="8" y1="15" x2="12" y2="15" stroke="#141414" strokeWidth="1.3" />
          <line x1="8" y1="19" x2="12" y2="19" stroke="#141414" strokeWidth="1.3" />
          <line x1="8" y1="23" x2="12" y2="23" stroke="#141414" strokeWidth="1.3" />
          <line x1="8" y1="27" x2="12" y2="27" stroke="#141414" strokeWidth="1.3" />
          <line x1="8" y1="31" x2="12" y2="31" stroke="#141414" strokeWidth="1.3" />

          {/* Bottom Pins */}
          <line x1="18" y1="35" x2="18" y2="39" stroke="#141414" strokeWidth="1.3" />
          <line x1="26" y1="35" x2="26" y2="39" stroke="#141414" strokeWidth="1.3" />
          <line x1="34" y1="35" x2="34" y2="39" stroke="#141414" strokeWidth="1.3" />
        </g>

        {/* Right PCB Circuit Traces - Signal pulses on hover */}
        <path d="M40 18 H47 L51 14" stroke="#FF6D00" strokeWidth="1.2" strokeLinecap="round" />
        <circle
          cx="51"
          cy="14"
          r="1.2"
          fill="#FF6D00"
          className="transition-transform duration-300 group-hover:scale-150"
          style={{ transformOrigin: '51px 14px' }}
        />
        <path d="M40 26 H46 L50 30" stroke="#FF6D00" strokeWidth="1.2" strokeLinecap="round" />
        <circle
          cx="50"
          cy="30"
          r="1.2"
          fill="#FF6D00"
          className="transition-transform duration-300 group-hover:scale-150"
          style={{ transformOrigin: '50px 30px' }}
        />

        {/* Mascot Slate - Reaches with logic probe */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="68" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="78" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="71" y1="35" x2="69" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="79" y1="35" x2="81" y2="43" stroke="#141414" strokeWidth="1.6" />

          {/* Slate holding a digital logic probe pen - Taps circuit on hover */}
          <g
            className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:rotate-6"
            style={{ transformOrigin: '68px 25px' }}
          >
            <path d="M68 25 L58 23" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="58" y1="23" x2="48" y2="21" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="53" cy="22" r="1.4" fill="#FF6D00" />
          </g>
        </g>
        <path
          d="M88 15 L90 12 L92 15 L90 18 Z"
          fill="#FF6D00"
          className="transition-transform duration-300 group-hover:scale-150 group-hover:rotate-45"
          style={{ transformOrigin: '90px 15px' }}
        />
      </svg>
    );
  }
  if (code === 'COMP-105L') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Motherboard Baseline & Circuit Traces */}
        <line x1="2" y1="39" x2="65" y2="39" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 54 38 H 58 L 62 34" stroke="#059669" strokeWidth="1" strokeLinecap="round" />
        <circle cx="62" cy="34" r="1" fill="#059669" />

        {/* Motherboard Electrolytic Capacitor */}
        <circle cx="57" cy="26" r="2.5" fill="#FFFFFF" stroke="#141414" strokeWidth="1.2" />
        <line x1="57" y1="24.5" x2="57" y2="27.5" stroke="#059669" strokeWidth="0.8" />
        <line x1="55.5" y1="26" x2="58.5" y2="26" stroke="#059669" strokeWidth="0.8" />

        {/* Motherboard DIMM Socket Body */}
        <rect x="4" y="31" width="48" height="7" rx="1.5" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
        <line x1="7" y1="33.5" x2="49" y2="33.5" stroke="#94A3B8" strokeWidth="0.9" />
        {/* Center Key Notch Divider in Socket */}
        <rect x="26.5" y="31" width="3" height="3.5" fill="#141414" />

        {/* Left Socket Ejector Clip - Snaps inward onto RAM on hover */}
        <g
          className="transition-transform duration-200 ease-out -rotate-12 group-hover:rotate-0"
          style={{ transformOrigin: '4px 34px' }}
        >
          <path d="M 4 34 L 2 26 L 4.5 26 L 5 32" stroke="#141414" strokeWidth="1.3" fill="#E2E8F0" />
          <polygon points="4.5,26 6.5,27.5 4.5,29" fill="#141414" />
        </g>

        {/* Right Socket Ejector Clip - Snaps inward onto RAM on hover */}
        <g
          className="transition-transform duration-200 ease-out rotate-12 group-hover:rotate-0"
          style={{ transformOrigin: '52px 34px' }}
        >
          <path d="M 52 34 L 54 26 L 51.5 26 L 51 32" stroke="#141414" strokeWidth="1.3" fill="#E2E8F0" />
          <polygon points="51.5,26 49.5,27.5 51.5,29" fill="#141414" />
        </g>

        {/* RAM Memory Module (Slides down smoothly into socket on hover) */}
        <g className="transition-transform duration-200 ease-out group-hover:translate-y-2.5">
          {/* Distinct Desktop RAM PCB Contour with Side Locking Notches & Center DDR Key Notch */}
          <path
            d="M 6 12.5 
               L 9 10.5 
               L 47 10.5 
               L 50 12.5 
               L 50 18.5 
               L 48.5 20 
               L 50 21.5 
               L 50 28.5 
               L 29.5 28.5 
               L 29.5 26 
               L 26.5 26 
               L 26.5 28.5 
               L 6 28.5 
               L 6 21.5 
               L 7.5 20 
               L 6 18.5 Z"
            fill="#ECFDF5"
            stroke="#141414"
            strokeWidth="1.3"
          />

          {/* Authentic Black BGA Memory IC Chips */}
          <rect x="8" y="17.5" width="7" height="6.5" rx="0.6" fill="#141414" />
          <circle cx="9.5" cy="19" r="0.5" fill="#FFFFFF" />
          <rect x="17" y="17.5" width="7" height="6.5" rx="0.6" fill="#141414" />
          <circle cx="18.5" cy="19" r="0.5" fill="#FFFFFF" />
          <rect x="32" y="17.5" width="7" height="6.5" rx="0.6" fill="#141414" />
          <circle cx="33.5" cy="19" r="0.5" fill="#FFFFFF" />
          <rect x="41" y="17.5" width="7" height="6.5" rx="0.6" fill="#141414" />
          <circle cx="42.5" cy="19" r="0.5" fill="#FFFFFF" />

          {/* Authentic Gold Contact Pins (Gold Fingers) with Center Notch Gap */}
          <path d="M 8 28.5 H 25.5" stroke="#F59E0B" strokeWidth="2" strokeDasharray="1 0.6" strokeLinecap="square" />
          <path d="M 30.5 28.5 H 48" stroke="#F59E0B" strokeWidth="2" strokeDasharray="1 0.6" strokeLinecap="square" />

          {/* Official RAM Module Spec Sticker Label */}
          <rect x="15" y="12" width="26" height="4.5" rx="0.8" fill="#FFFFFF" stroke="#141414" strokeWidth="0.8" />
          <text
            x="28"
            y="15.4"
            fill="#047857"
            fontSize="3.4"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.4"
          >
            RAM • DDR5
          </text>
        </g>

        {/* Downward Installation Guide Arrow */}
        <g className="transition-transform duration-200 group-hover:translate-y-1">
          <path
            d="M 28 3.5 L 28 7.5 M 26 5.5 L 28 7.5 L 30 5.5"
            stroke="#F57C00"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Mascot Slate holding precision screwdriver */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1 origin-bottom">
          <rect x="68" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="78" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="71" y1="35" x2="69" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="79" y1="35" x2="81" y2="43" stroke="#141414" strokeWidth="1.6" />

          {/* Slate holding precision magnetic screwdriver - Turns screw on hover */}
          <g
            className="transition-transform duration-200 group-hover:rotate-15"
            style={{ transformOrigin: '58px 24px' }}
          >
            <rect x="58" y="22" width="7" height="4" rx="1" fill="#F57C00" stroke="#141414" strokeWidth="1" />
            <line x1="58" y1="24" x2="48" y2="24" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
            <polygon points="48,22.5 45,24 48,25.5" fill="#141414" />
            <path d="M68 25 L65 24" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </g>

        {/* Precision Motherboard Screw - Spins on hover */}
        <circle cx="56" cy="36" r="1.8" fill="#FFFFFF" stroke="#141414" strokeWidth="1" />
        <line
          x1="55"
          y1="36"
          x2="57"
          y2="36"
          stroke="#141414"
          strokeWidth="0.8"
          className="transition-transform duration-300 group-hover:rotate-90"
          style={{ transformOrigin: '56px 36px' }}
        />
      </svg>
    );
  }
  if (code === 'MATH-101') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        <rect
          x="6"
          y="8"
          width="46"
          height="30"
          rx="3"
          stroke="#141414"
          strokeWidth="1.6"
          fill="#FAF5FF"
          className="transition-colors duration-200 group-hover:stroke-[#7C3AED]"
        />
        <path
          d="M16 14 C14 14 12 16 12 19 L12 27 C12 30 14 32 16 32"
          stroke="#7C3AED"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="transition-transform duration-200 group-hover:scale-105"
          style={{ transformOrigin: '14px 23px' }}
        />
        <path d="M22 28 L25 21 L29 27 M25 24 L28 24" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M33 26 L35 28 L38 18 L46 18" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx="42"
          cy="24"
          r="2"
          fill="#7C3AED"
          className="transition-transform duration-200 group-hover:scale-125"
          style={{ transformOrigin: '42px 24px' }}
        />
        {/* Mascot Slate writing on board */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="66" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="70" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="76" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="69" y1="35" x2="67" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="77" y1="35" x2="79" y2="43" stroke="#141414" strokeWidth="1.6" />
          <path d="M66 23 Q58 24 54 22" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          <rect
            x="52"
            y="20"
            width="3"
            height="4"
            rx="1"
            fill="#7C3AED"
            stroke="#141414"
            strokeWidth="0.8"
            className="transition-transform duration-150 group-hover:rotate-12"
            style={{ transformOrigin: '53px 22px' }}
          />
        </g>
        <path
          d="M90 12 L92 10 L94 12 L92 14 Z"
          fill="#7C3AED"
          className="transition-transform duration-300 group-hover:scale-150 group-hover:rotate-90"
          style={{ transformOrigin: '92px 12px' }}
        />
      </svg>
    );
  }
  if (code === 'HUM-101' || code === 'SS-103') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Stage Baseline */}
        <line x1="8" y1="40" x2="88" y2="40" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />

        {/* Presentation Podium / Lectern */}
        <polygon points="12,20 38,18 36,23 14,25" stroke="#141414" strokeWidth="1.5" fill="#E2E8F0" />
        <polygon points="16,23 34,21 32,40 18,40" stroke="#141414" strokeWidth="1.5" fill="#FFFFFF" />
        <rect x="20" y="26" width="10" height="9" rx="1.5" stroke="#059669" strokeWidth="1" fill="#ECFDF5" />
        <line x1="22.5" y1="29.5" x2="27.5" y2="29.5" stroke="#059669" strokeWidth="0.8" />
        <line x1="22.5" y1="32" x2="26" y2="32" stroke="#059669" strokeWidth="0.8" />

        {/* Gooseneck Microphone - Tilts slightly on hover */}
        <g
          className="transition-transform duration-200 group-hover:rotate-3"
          style={{ transformOrigin: '22px 19px' }}
        >
          <path d="M22 19 C21 15 26 14 26 10" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <rect x="24" y="7" width="5" height="4" rx="1.5" fill="#059669" stroke="#141414" strokeWidth="1" />
          <line x1="25.5" y1="9" x2="27.5" y2="9" stroke="#FFFFFF" strokeWidth="0.8" />
        </g>

        {/* Speech Cue Cards */}
        <rect x="28" y="16" width="8" height="6" rx="0.8" transform="rotate(-6 28 16)" fill="#FFFFFF" stroke="#141414" strokeWidth="1" />
        <line x1="30" y1="18.5" x2="34" y2="18" stroke="#059669" strokeWidth="0.8" />

        {/* Slate Delivering Presentation - Gestures and bobs on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="42" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="46" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="52" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="45" y1="35" x2="43" y2="40" stroke="#141414" strokeWidth="1.6" />
          <line x1="53" y1="35" x2="55" y2="40" stroke="#141414" strokeWidth="1.6" />
          <path d="M42 24 L36 22" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M58 23 Q64 19 66 15"
            stroke="#141414"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="transition-transform duration-200 group-hover:-rotate-12"
            style={{ transformOrigin: '58px 23px' }}
          />
        </g>

        {/* Voice Projection Acoustic Waves - Expand outward on hover */}
        <g
          className="transition-transform duration-300 ease-out group-hover:scale-125 group-hover:translate-x-1"
          style={{ transformOrigin: '72px 17px' }}
        >
          <path d="M72 13 Q76 17 72 21" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M77 10 Q83 17 77 24" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M82 7 Q90 17 82 27" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
        </g>
        <path
          d="M94 12 L95 10 L96 12 L95 14 Z"
          fill="#059669"
          className="transition-transform duration-300 group-hover:scale-150 group-hover:rotate-45"
          style={{ transformOrigin: '95px 12px' }}
        />
      </svg>
    );
  }
  if (code === 'SS-104') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Continuous Ground Baseline */}
        <line x1="6" y1="39" x2="86" y2="39" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />

        {/* Sleek Wooden Rehal Stand */}
        <line x1="14" y1="39" x2="42" y2="24" stroke="#8D6E63" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="42" y1="39" x2="14" y2="24" stroke="#8D6E63" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="28" cy="31.5" r="1.3" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="0.8" />
        <path d="M14 39 C15.5 37 18.5 37 20 39" stroke="#8D6E63" strokeWidth="1.2" fill="none" />
        <path d="M36 39 C37.5 37 40.5 37 42 39" stroke="#8D6E63" strokeWidth="1.2" fill="none" />

        {/* Open Holy Quran (Flowing Realistic Pages) - Slight lift on hover */}
        <g className="transition-transform duration-200 group-hover:-translate-y-0.5">
          <path d="M12 22 C17 19 24 20 28 24 C32 20 39 19 44 22 L44 27 C39 24 32 25 28 29 C24 25 17 24 12 27 Z" fill="#15803D" stroke="#141414" strokeWidth="1.2" />
          <path d="M13 21 C18 18 24 19 28 23.5 L28 28 C24 24 18 23 13 26 Z" fill="#FFFFFF" stroke="#141414" strokeWidth="1" />
          <path d="M43 21 C38 18 32 19 28 23.5 L28 28 C32 24 38 23 43 26 Z" fill="#FFFFFF" stroke="#141414" strokeWidth="1" />
          <path d="M13 21 C18 18 24 19 28 23.5" stroke="#F59E0B" strokeWidth="1" />
          <path d="M43 21 C38 18 32 19 28 23.5" stroke="#F59E0B" strokeWidth="1" />
          <line x1="16" y1="23" x2="24" y2="23" stroke="#15803D" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="17" y1="25" x2="25" y2="25" stroke="#15803D" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="32" y1="23" x2="40" y2="23" stroke="#15803D" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="31" y1="25" x2="39" y2="25" stroke="#15803D" strokeWidth="0.8" strokeLinecap="round" />
          {/* Emerald Silk Ribbon Bookmark - Sways on hover */}
          <path
            d="M28 25 Q29 32 31 38"
            stroke="#15803D"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            className="transition-transform duration-300 group-hover:rotate-6"
            style={{ transformOrigin: '28px 25px' }}
          />
        </g>

        {/* Gentle Radiant Rays of Light (Noor) - Glows and extends on hover */}
        <g
          className="transition-transform duration-300 ease-out group-hover:scale-125"
          style={{ transformOrigin: '28px 18px' }}
        >
          <line x1="28" y1="18" x2="28" y2="11" stroke="#F59E0B" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <line x1="23" y1="19" x2="19" y2="13" stroke="#F59E0B" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <line x1="33" y1="19" x2="37" y2="13" stroke="#F59E0B" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <circle cx="28" cy="9" r="1.1" fill="#F59E0B" />
        </g>

        {/* Slate Sitting Close Respectfully Reading - Tilts head reverently */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1 origin-bottom">
          <rect x="54" y="14" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="58" cy="21" r="1.5" fill="#FFFFFF" />
          <circle cx="64" cy="21" r="1.5" fill="#FFFFFF" />
          <line x1="57" y1="36" x2="55" y2="41" stroke="#141414" strokeWidth="1.6" />
          <line x1="65" y1="36" x2="67" y2="41" stroke="#141414" strokeWidth="1.6" />
          <path d="M54 26 Q48 28 44 32" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M54 28 Q47 30 42 34" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Crescent & Star in Sky - Brightens and scales */}
        <g
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ transformOrigin: '84px 11px' }}
        >
          <path d="M82 10 A 3 3 0 0 0 85.5 15 A 3.8 3.8 0 0 1 82 10" fill="#15803D" />
          <polygon points="86,7 86.6,8.2 88,8.2 86.9,9 87.3,10.2 86,9.5 84.7,10.2 85.1,9 84,8.2 85.4,8.2" fill="#F59E0B" />
        </g>
      </svg>
    );
  }
  if (code === 'SS-111' || code === 'SS-112') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        <line x1="4" y1="39" x2="86" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left Minaret */}
        <rect x="6" y="17" width="7" height="22" stroke="#141414" strokeWidth="1.3" fill="#FFFFFF" />
        <line x1="4" y1="21" x2="15" y2="21" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="5" y="19" width="9" height="2" fill="#047857" />
        <polygon points="9.5,11 5,17 14,17" stroke="#141414" strokeWidth="1.3" fill="#ECFDF5" />
        <line x1="9.5" y1="11" x2="9.5" y2="7" stroke="#141414" strokeWidth="1.1" />
        <circle cx="9.5" cy="6.5" r="1" fill="#047857" />
        <path d="M8 27 V25 C8 24 11 24 11 25 V27" stroke="#141414" strokeWidth="1" fill="#047857" />

        {/* Central Mosque Main Hall */}
        <rect x="15" y="24" width="24" height="15" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
        <path d="M23 39 V31 C23 28 31 28 31 31 V39" stroke="#141414" strokeWidth="1.3" fill="#ECFDF5" />
        {/* Central Mosque Grand Dome */}
        <path d="M15 24 C15 16 23 12 27 10 C31 12 39 16 39 24 Z" stroke="#141414" strokeWidth="1.5" fill="#ECFDF5" />
        <line x1="27" y1="10" x2="27" y2="6" stroke="#141414" strokeWidth="1.3" />
        <path
          d="M27 3.5 A 2.5 2.5 0 0 0 29.5 7.5 A 3 3 0 0 1 27 3.5"
          fill="#047857"
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ transformOrigin: '27px 5.5px' }}
        />

        {/* Right Minaret */}
        <rect x="41" y="17" width="7" height="22" stroke="#141414" strokeWidth="1.3" fill="#FFFFFF" />
        <line x1="39" y1="21" x2="50" y2="21" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="40" y="19" width="9" height="2" fill="#047857" />
        <polygon points="44.5,11 40,17 49,17" stroke="#141414" strokeWidth="1.3" fill="#ECFDF5" />
        <line x1="44.5" y1="11" x2="44.5" y2="7" stroke="#141414" strokeWidth="1.1" />
        <circle cx="44.5" cy="6.5" r="1" fill="#047857" />
        <path d="M43 27 V25 C43 24 46 24 46 25 V27" stroke="#141414" strokeWidth="1" fill="#047857" />

        {/* Mascot Slate - Pops up slightly */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="66" y="13" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="70" cy="20" r="1.5" fill="#FFFFFF" />
          <circle cx="76" cy="20" r="1.5" fill="#FFFFFF" />
          <line x1="69" y1="35" x2="67" y2="43" stroke="#141414" strokeWidth="1.6" />
          <line x1="77" y1="35" x2="79" y2="43" stroke="#141414" strokeWidth="1.6" />
          <rect x="54" y="22" width="10" height="13" rx="1.5" stroke="#141414" strokeWidth="1.3" fill="#ECFDF5" />
          <line x1="59" y1="22" x2="59" y2="35" stroke="#047857" strokeWidth="1.2" />
          <path d="M66 25 L62 26" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <path
          d="M92 11 A 3.5 3.5 0 0 0 95.5 16.5 A 4.5 4.5 0 0 1 92 11"
          fill="#F59E0B"
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ transformOrigin: '92px 13px' }}
        />
        <path
          d="M87 8 L88 6 L89 8 L88 10 Z"
          fill="#047857"
          className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-45"
          style={{ transformOrigin: '88px 8px' }}
        />
      </svg>
    );
  }
  if (code === 'SS-113') {
    return (
      <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
        {/* Ground baseline */}
        <line x1="4" y1="39" x2="60" y2="39" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />

        {/* Minar-e-Pakistan Base Plinth */}
        <rect x="6" y="36" width="24" height="3" rx="0.5" stroke="#141414" strokeWidth="1.2" fill="#E2E8F0" />
        <rect x="8" y="33" width="20" height="3" rx="0.5" stroke="#141414" strokeWidth="1.2" fill="#FFFFFF" />

        {/* Minar-e-Pakistan Flower Petals Base */}
        <path d="M10 33 C10 28 13 25 16 24" stroke="#141414" strokeWidth="1.4" fill="none" />
        <path d="M26 33 C26 28 23 25 20 24" stroke="#141414" strokeWidth="1.4" fill="none" />

        {/* Minar-e-Pakistan Tower Shaft */}
        <path d="M16 24 L17 11 L19 11 L20 24 Z" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
        <line x1="18" y1="24" x2="18" y2="11" stroke="#94A3B8" strokeWidth="1" />

        {/* Top Balcony & Dome */}
        <line x1="15" y1="11" x2="21" y2="11" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M16 11 C16 7 20 7 20 11 Z" stroke="#141414" strokeWidth="1.2" fill="#047857" />
        <line x1="18" y1="7" x2="18" y2="4" stroke="#141414" strokeWidth="1.1" />
        <circle cx="18" cy="3.5" r="0.8" fill="#F59E0B" />

        {/* Mascot Slate in Center - Standing tall with flag */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 origin-bottom">
          <rect x="34" y="14" width="16" height="22" rx="8" fill="#141414" />
          <circle cx="38" cy="21" r="1.5" fill="#FFFFFF" />
          <circle cx="44" cy="21" r="1.5" fill="#FFFFFF" />
          <line x1="37" y1="36" x2="35" y2="42" stroke="#141414" strokeWidth="1.6" />
          <line x1="45" y1="36" x2="47" y2="42" stroke="#141414" strokeWidth="1.6" />
          <path d="M50 25 L54 25" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* Flagpole */}
        <line x1="54" y1="6" x2="54" y2="39" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="54" cy="5.5" r="1.3" fill="#F59E0B" />

        {/* National Flag of Pakistan - Waves dynamically on hover! */}
        <g
          className="transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-3"
          style={{ transformOrigin: '54px 16px' }}
        >
          {/* White Hoist Stripe */}
          <path d="M54 8.5 C57 7.5 60 9 63 8.2 L63 23.2 C60 24 57 22.5 54 23.5 Z" fill="#FFFFFF" stroke="#141414" strokeWidth="1.3" />
          {/* Dark Green Fly Field */}
          <path d="M63 8.2 C72 7 81 10.5 92 8 L92 23 C81 25.5 72 22 63 23.2 Z" fill="#047857" stroke="#141414" strokeWidth="1.3" />

          {/* Official Crescent & Star */}
          <path d="M74 18 C72.5 14.5 75 11 78.5 10.5 C76 12 75.5 15 77.5 17.5 C79.5 20 82.5 19 84 17.5 C81.5 21 76 21.5 74 18 Z" fill="#FFFFFF" />
          <polygon points="81.5,11.2 82.2,12.8 83.9,12.8 82.5,13.8 83,15.4 81.5,14.4 80,15.4 80.5,13.8 79.1,12.8 80.8,12.8" fill="#FFFFFF" />
        </g>

        <path
          d="M96 11 L97 9 L98 11 L97 13 Z"
          fill="#047857"
          className="transition-transform duration-300 group-hover:scale-150 group-hover:rotate-45"
          style={{ transformOrigin: '97px 11px' }}
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 110 45" className="w-24 h-10 shrink-0 overflow-visible" fill="none">
      <g
        className="transition-transform duration-200 group-hover:scale-105"
        style={{ transformOrigin: '29px 23px' }}
      >
        <rect x="12" y="10" width="34" height="26" rx="3" stroke="#141414" strokeWidth="1.6" fill="#FFFFFF" />
        <line x1="18" y1="16" x2="38" y2="16" stroke="#141414" strokeWidth="1.3" />
        <line x1="18" y1="22" x2="34" y2="22" stroke="#141414" strokeWidth="1.3" />
        <line x1="18" y1="28" x2="30" y2="28" stroke="#141414" strokeWidth="1.3" />
      </g>
      <g className="transition-all duration-200 ease-out group-hover:-translate-y-2 origin-bottom">
        <rect x="62" y="13" width="16" height="22" rx="8" fill="#141414" />
        <circle cx="66" cy="20" r="1.5" fill="#FFFFFF" />
        <circle cx="72" cy="20" r="1.5" fill="#FFFFFF" />
        <line x1="65" y1="35" x2="63" y2="43" stroke="#141414" strokeWidth="1.6" />
        <line x1="73" y1="35" x2="75" y2="43" stroke="#141414" strokeWidth="1.6" />
        <line
          x1="62"
          y1="22"
          x2="57"
          y2="18"
          stroke="#141414"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="transition-transform duration-200 group-hover:-rotate-20"
          style={{ transformOrigin: '62px 22px' }}
        />
      </g>
    </svg>
  );
}

function InteractiveSlateLogo({
  onReset,
  isCompanionActive,
  onToggleCompanion,
}: {
  onReset: () => void;
  isCompanionActive: boolean;
  onToggleCompanion: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const mascotRef = useRef<HTMLDivElement>(null);

  // Lifelike blinking loop: blinks every 2.5 - 5 seconds with occasional double-blinks
  useEffect(() => {
    let timeoutId: number;
    let isCancelled = false;

    const triggerBlink = () => {
      if (isCancelled) return;
      setIsBlinking(true);

      setTimeout(() => {
        if (isCancelled) return;
        setIsBlinking(false);

        // 25% chance of a playful double-blink
        if (Math.random() < 0.25) {
          setTimeout(() => {
            if (isCancelled) return;
            setIsBlinking(true);
            setTimeout(() => {
              if (isCancelled) return;
              setIsBlinking(false);
              scheduleNextBlink();
            }, 100);
          }, 90);
        } else {
          scheduleNextBlink();
        }
      }, 120);
    };

    const scheduleNextBlink = () => {
      const delay = 2500 + Math.random() * 2500;
      timeoutId = window.setTimeout(triggerBlink, delay);
    };

    scheduleNextBlink();
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Eye gaze tracking: Eyes follow mouse across screen while resting in header
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current || isCompanionActive) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) {
        setEyeOffset({ x: 0, y: 0 });
        return;
      }
      const maxOffset = 1.6;
      const ratio = Math.min(dist / 220, 1);
      const r = maxOffset * ratio;
      setEyeOffset({
        x: (dx / dist) * r,
        y: (dy / dist) * r,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isCompanionActive]);

  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 450);

    // Companion mode is strictly desktop only (>= 768px). On mobile viewports, companion is disabled.
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      onToggleCompanion();
    } else {
      onReset();
    }
  };

  const handleWordmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReset();
  };

  return (
    <div
      className="relative flex items-center gap-3 select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hand-drawn Slate Mascot Creature / Docking Station */}
      <div
        ref={mascotRef}
        role="button"
        tabIndex={0}
        onClick={handleMascotClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMascotClick(e as any);
          }
        }}
        title={
          typeof window !== 'undefined' && window.innerWidth >= 768
            ? (isCompanionActive
                ? 'Slate mascot is following cursor. Click mascot to return (or press Esc).'
                : 'Click mascot to toggle Cursor Companion')
            : 'Return to Home'
        }
        className={`w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0 transition-all duration-300 ${
          isCompanionActive
            ? 'bg-neutral-100 border-2 border-dashed border-[#141414] scale-95 shadow-none'
            : 'bg-[#141414] shadow-xs'
        } ${
          isJumping
            ? '-translate-y-2.5 scale-110 rotate-12'
            : isHovered
            ? '-translate-y-1 scale-105 shadow-[2px_2px_0px_#141414]'
            : ''
        }`}
      >
        {isCompanionActive ? (
          /* Roaming indicator in header base */
          <div className="flex flex-col items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
          </div>
        ) : (
          <>
            {/* Blinking White Dot Eyes that track cursor */}
            <div className="flex gap-1.5 items-center">
              <span
                className={`bg-white block transition-all duration-75 origin-center ${
                  isBlinking
                    ? 'w-1.5 h-0.5 rounded-none opacity-90'
                    : isHovered
                    ? 'w-1.5 h-1.5 rounded-full scale-125'
                    : 'w-1.5 h-1.5 rounded-full'
                }`}
                style={{
                  transform: isBlinking
                    ? `translate(${eyeOffset.x}px, ${eyeOffset.y}px) scaleY(0.15)`
                    : `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                }}
              />
              <span
                className={`bg-white block transition-all duration-75 origin-center ${
                  isBlinking
                    ? 'w-1.5 h-0.5 rounded-none opacity-90'
                    : isHovered
                    ? 'w-1.5 h-1.5 rounded-full scale-125'
                    : 'w-1.5 h-1.5 rounded-full'
                }`}
                style={{
                  transform: isBlinking
                    ? `translate(${eyeOffset.x}px, ${eyeOffset.y}px) scaleY(0.15)`
                    : `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                }}
              />
            </div>

            {/* Tiny cartoon sweat droplet on hover */}
            {isHovered && (
              <span className="absolute -top-1.5 -right-1 w-2 h-2.5 bg-[#1E88E5] rounded-full rounded-tr-none animate-bounce" />
            )}

            {/* Wobbly stick legs */}
            <div className="absolute -bottom-2 flex gap-1.5">
              <span
                className={`w-0.5 h-2 bg-black block transition-transform duration-200 origin-top ${
                  isHovered ? 'rotate-12' : ''
                }`}
              />
              <span
                className={`w-0.5 h-2 bg-black block transition-transform duration-200 origin-top ${
                  isHovered ? '-rotate-12' : ''
                }`}
              />
            </div>
          </>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleWordmarkClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleWordmarkClick(e as any);
          }
        }}
        className="flex items-baseline gap-2 cursor-pointer focus:outline-hidden"
        title="Return to Home"
      >
        <span
          className="text-xl font-bold tracking-tight text-[#141414] hover:text-[#FF6D00] transition-colors"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          slate
        </span>
        <span
          className="text-xs font-bold text-neutral-500 hidden sm:inline"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '15px' }}
        >
          {isCompanionActive ? '[ companion active ]' : '[ BSCS Green ]'}
        </span>
      </div>
    </div>
  );
}

function SlateCursorCompanion({ onDismiss }: { onDismiss: () => void }) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Auto-dismiss companion if window is resized below desktop breakpoint (< 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        onDismiss();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onDismiss]);
  const mascotRef = useRef<HTMLDivElement>(null);
  const leftLegRef = useRef<HTMLSpanElement>(null);
  const rightLegRef = useRef<HTMLSpanElement>(null);
  const pupilRef1 = useRef<HTMLSpanElement>(null);
  const pupilRef2 = useRef<HTMLSpanElement>(null);

  // Lifelike blinking for roaming companion
  useEffect(() => {
    let timeoutId: number;
    let isCancelled = false;

    const triggerBlink = () => {
      if (isCancelled) return;
      setIsBlinking(true);

      setTimeout(() => {
        if (isCancelled) return;
        setIsBlinking(false);

        if (Math.random() < 0.25) {
          setTimeout(() => {
            if (isCancelled) return;
            setIsBlinking(true);
            setTimeout(() => {
              if (isCancelled) return;
              setIsBlinking(false);
              scheduleNext();
            }, 100);
          }, 90);
        } else {
          scheduleNext();
        }
      }, 120);
    };

    const scheduleNext = () => {
      timeoutId = window.setTimeout(triggerBlink, 2500 + Math.random() * 2500);
    };

    scheduleNext();
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Position & physics refs for 60fps rAF loop without triggering React re-renders
  const mousePosRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
  });
  const posRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: 40, // spawn near header
  });
  const lastAngleRef = useRef<number>(-Math.PI / 2); // angle around cursor
  const velRef = useRef({ vx: 0, vy: 0 });
  const phaseRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Escape key listener for immediate dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // 60 FPS lerp follow and walking animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const updatePhysics = () => {
      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;

      // Dynamic Radial Perimeter:
      // Slate stays on a comfortable radius circle around the cursor (46px radius),
      // always touching the closest point on that radius circle to where Slate currently is.
      const ORBIT_RADIUS = 46;

      // Vector from mouse cursor to Slate's current center
      const currentCenterX = posRef.current.x + 18;
      const currentCenterY = posRef.current.y + 18;
      const diffX = currentCenterX - mx;
      const diffY = currentCenterY - my;
      const distFromCursor = Math.hypot(diffX, diffY);

      // Closest point on the radius circle around the cursor
      if (distFromCursor > 1) {
        lastAngleRef.current = Math.atan2(diffY, diffX);
      }
      const angle = lastAngleRef.current;

      // Target position along the radius circle nearest to Slate's current position
      let targetX = mx + Math.cos(angle) * ORBIT_RADIUS - 18;
      let targetY = my + Math.sin(angle) * ORBIT_RADIUS - 18;

      // Viewport safety clamp: ensure Slate never gets pushed offscreen
      targetX = Math.max(8, Math.min(window.innerWidth - 44, targetX));
      targetY = Math.max(8, Math.min(window.innerHeight - 44, targetY));

      const toTargetX = targetX - posRef.current.x;
      const toTargetY = targetY - posRef.current.y;
      const distanceToTarget = Math.hypot(toTargetX, toTargetY);

      // Smooth, responsive walking speed to reach the perimeter of the radius circle
      const maxSpeed = 3.6; // gentle jogging speed
      const step = distanceToTarget > 0.5 ? Math.min(distanceToTarget * 0.08, maxSpeed) : 0;

      if (distanceToTarget > 0.5) {
        const moveX = (toTargetX / distanceToTarget) * step;
        const moveY = (toTargetY / distanceToTarget) * step;
        posRef.current.x += moveX;
        posRef.current.y += moveY;
        velRef.current = { vx: moveX, vy: moveY };
      } else {
        velRef.current = { vx: 0, vy: 0 };
      }

      // Animated walking legs: cadence dynamically scales with step speed
      if (step > 0.25) {
        phaseRef.current += Math.min(step * 0.04, 0.12);
        const legAngle = Math.sin(phaseRef.current) * 20;
        if (leftLegRef.current) leftLegRef.current.style.transform = `rotate(${legAngle}deg)`;
        if (rightLegRef.current) rightLegRef.current.style.transform = `rotate(${-legAngle}deg)`;
      } else {
        if (leftLegRef.current) leftLegRef.current.style.transform = 'rotate(0deg)';
        if (rightLegRef.current) rightLegRef.current.style.transform = 'rotate(0deg)';
      }

      // Dynamic tilt based on horizontal velocity & walking bob
      const targetTilt = distanceToTarget > 1.5 ? Math.max(-7, Math.min(7, (toTargetX / (distanceToTarget || 1)) * 7)) : 0;
      const bob = step > 0.25 ? Math.abs(Math.sin(phaseRef.current * 2)) * 1.2 : 0;

      if (mascotRef.current) {
        mascotRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y - bob}px, 0) rotate(${targetTilt}deg)`;
      }

      // Pupils look directly toward mouse pointer tip from wherever Slate is on the radius
      const newCenterX = posRef.current.x + 18;
      const newCenterY = posRef.current.y + 18;
      const eyeDx = mx - newCenterX;
      const eyeDy = my - newCenterY;
      const eyeDist = Math.hypot(eyeDx, eyeDy);
      const pupilR = 1.6;
      const px = eyeDist > 0 ? (eyeDx / eyeDist) * pupilR : 0;
      const py = eyeDist > 0 ? (eyeDy / eyeDist) * pupilR : 0;

      if (pupilRef1.current) pupilRef1.current.style.transform = `translate(${px}px, ${py}px)`;
      if (pupilRef2.current) pupilRef2.current.style.transform = `translate(${px}px, ${py}px)`;

      rafIdRef.current = requestAnimationFrame(updatePhysics);
    };

    rafIdRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <>
      {/* Moving Mascot Follower (Desktop only; pointer-events-none so it NEVER blocks clicks) */}
      <div
        ref={mascotRef}
        className="fixed top-0 left-0 w-9 h-9 z-50 pointer-events-none select-none group"
        style={{ willChange: 'transform' }}
      >
        <div className="w-9 h-9 bg-[#141414] rounded-xl flex items-center justify-center relative shadow-[3px_3px_0px_rgba(0,0,0,0.35)]">
          {/* Pupil Eyes */}
          <div className="flex gap-1.5 items-center">
            <span
              ref={pupilRef1}
              className={`bg-white block transition-all duration-75 origin-center ${
                isBlinking ? 'w-1.5 h-0.5 rounded-none opacity-90' : 'w-1.5 h-1.5 rounded-full'
              }`}
              style={{ willChange: 'transform' }}
            />
            <span
              ref={pupilRef2}
              className={`bg-white block transition-all duration-75 origin-center ${
                isBlinking ? 'w-1.5 h-0.5 rounded-none opacity-90' : 'w-1.5 h-1.5 rounded-full'
              }`}
              style={{ willChange: 'transform' }}
            />
          </div>

          {/* Tiny energetic accent droplet */}
          <span className="absolute -top-1.5 -right-1 w-2 h-2.5 bg-[#FF6D00] rounded-full rounded-tr-none animate-pulse" />

          {/* Dynamic Walking Legs */}
          <div className="absolute -bottom-2 flex gap-1.5">
            <span
              ref={leftLegRef}
              className="w-0.5 h-2.5 bg-[#141414] block origin-top"
              style={{ willChange: 'transform' }}
            />
            <span
              ref={rightLegRef}
              className="w-0.5 h-2.5 bg-[#141414] block origin-top"
              style={{ willChange: 'transform' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyFolderSlate({
  folderName,
  courseCode,
  courseTitle,
}: {
  folderName: string;
  courseCode?: string;
  courseTitle?: string;
}) {
  const nameLower = folderName.toLowerCase();
  const isCourseCard = nameLower.includes('course card');
  const isNoClass =
    nameLower.includes('week 01') ||
    (courseCode === 'COMP-111L' && nameLower.includes('week 02')) ||
    (courseCode === 'SS-103' && nameLower.includes('week 04'));

  const isFoundationMath =
    courseCode === 'MATH-101' ||
    courseTitle?.toLowerCase().includes('foundation math') ||
    courseTitle?.toLowerCase().includes('foundation mathematics');

  const isQuran =
    courseCode === 'SS-104' ||
    courseTitle?.toLowerCase().includes('quran') ||
    courseTitle?.toLowerCase().includes('al-quran') ||
    courseTitle?.toLowerCase().includes('alquran');

  const isPFWeek03 =
    (courseCode === 'COMP-111' ||
      (courseTitle?.toLowerCase().includes('programming fundamentals') &&
        !courseTitle?.toLowerCase().includes('lab'))) &&
    nameLower.includes('week 03');

  if (isPFWeek03) {
    const bubbleText = 'online class';
    const titleText = 'Week 03: Online Lecture';
    const descText =
      'Week 03 class was held online, and no official slides or study materials were shared. If anyone took notes during the session, please share them with us so we can add them here!';

    return (
      <div className="bg-white border-2 border-[#141414] rounded-2xl p-6 sm:p-10 text-center max-w-lg w-full mx-auto shadow-[4px_4px_0px_#141414] space-y-5 my-8">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#141414] bg-[#FFF8F2] text-xs font-mono font-medium text-[#141414]">
          <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>PROGRAMMING FUNDAMENTALS</span>
        </div>

        {/* Hand-Drawn Mascot Illustration with C++ Code Doodles */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 200 115" className="w-56 h-32 sm:w-64 sm:h-36 overflow-visible" fill="none">
            {/* Ground Shadow */}
            <ellipse cx="100" cy="98" rx="28" ry="4" fill="#F1F5F9" />

            {/* Left Doodles (Curly Braces & cout Stream) */}
            <g className="anim-math-float1">
              {/* Curly Brace { */}
              <path d="M 32 38 C 26 38 24 43 24 47 C 24 51 22 53 18 53 C 22 53 24 55 24 59 C 24 63 26 68 32 68" stroke="#141414" strokeWidth="2" strokeLinecap="round" fill="none" />
              
              {/* Code snippet: cout << */}
              <rect x="28" y="74" width="46" height="18" rx="4" fill="#F8FAFC" stroke="#141414" strokeWidth="1.6" />
              <text x="51" y="86" fill="#141414" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">cout &lt;&lt;</text>

              {/* Semicolon ; */}
              <circle cx="48" cy="42" r="1.5" fill="#64748B" />
              <path d="M 48 48 C 48 51 46 53 44 54" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Right Doodles (Terminal Console & int variable) */}
            <g className="anim-math-float2">
              {/* Terminal Window Box */}
              <rect x="146" y="36" width="38" height="26" rx="4" fill="#141414" stroke="#141414" strokeWidth="1.6" />
              <circle cx="152" cy="42" r="1.2" fill="#EF4444" />
              <circle cx="156" cy="42" r="1.2" fill="#F59E0B" />
              <circle cx="160" cy="42" r="1.2" fill="#10B981" />
              <path d="M 152 50 L 156 53 L 152 56" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="159" y1="56" x2="166" y2="56" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />

              {/* Logic Operator badge: && */}
              <rect x="150" y="72" width="32" height="18" rx="4" fill="#FFFBEB" stroke="#141414" strokeWidth="1.6" />
              <text x="166" y="85" fill="#141414" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">&amp;&amp;</text>
            </g>

            {/* Slate mascot */}
            <g className="transition-transform duration-300">
              {/* Little feet */}
              <line x1="93" y1="80" x2="91" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="107" y1="80" x2="109" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />

              {/* Main Pill Body */}
              <rect x="84" y="34" width="32" height="48" rx="16" fill="#141414" />

              {/* Big Expressive Friendly Eyes */}
              <circle cx="93" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="94" cy="48" r="1.1" fill="#141414" />
              <circle cx="107" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="108" cy="48" r="1.1" fill="#141414" />

              {/* Curious slight smile */}
              <path d="M 97 58 Q 100 61 103 58" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />

              {/* Open welcoming / shrugging arms */}
              <path d="M 84 56 Q 70 54 66 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="65" cy="47" r="2.2" fill="#141414" />
              <path d="M 116 56 Q 130 54 134 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="135" cy="47" r="2.2" fill="#141414" />

              {/* Floating Speech Bubble */}
              <g className="anim-question-float">
                <rect x="94" y="10" width="88" height="24" rx="7" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" />
                <path d="M 116 34 L 112 40 L 122 34 Z" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" strokeLinejoin="round" />
                <text x="138" y="26" fill="#141414" fontSize="10.5" fontWeight="bold" fontFamily="'Space Grotesk', sans-serif" textAnchor="middle">{bubbleText}</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Messaging */}
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
            {titleText}
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {descText}
          </p>
        </div>
      </div>
    );
  }

  if (isFoundationMath) {
    return (
      <div className="bg-white border-2 border-[#141414] rounded-2xl p-6 sm:p-10 text-center max-w-lg w-full mx-auto shadow-[4px_4px_0px_#141414] space-y-5 my-8">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#141414] bg-[#FFF8F2] text-xs font-mono font-medium text-[#141414]">
          <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>FOUNDATION MATHEMATICS-I</span>
        </div>

        {/* Hand-Drawn Mascot Illustration with Math Doodles */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 200 115" className="w-56 h-32 sm:w-64 sm:h-36 overflow-visible" fill="none">
            {/* Ground Shadow */}
            <ellipse cx="100" cy="98" rx="28" ry="4" fill="#F1F5F9" />

            {/* Left Math Doodles */}
            <g className="anim-math-float1">
              {/* Square root x: sqrt(x) */}
              <path d="M 28 42 L 32 42 L 35 52 L 42 30 L 56 30" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <text x="45" y="44" fill="#64748B" fontSize="13" fontFamily="'Space Grotesk', monospace" fontWeight="bold">x</text>

              {/* Plus & Minus: +/- */}
              <path d="M 38 66 L 48 66 M 43 61 L 43 71 M 38 76 L 48 76" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

              {/* Pi: pi */}
              <path d="M 30 90 L 46 90 M 35 90 L 35 99 M 42 90 L 43 99" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Right Math Doodles */}
            <g className="anim-math-float2">
              {/* Integral: integral */}
              <path d="M 170 34 C 165 34 163 37 163 42 L 163 56 C 163 61 161 64 156 64" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Summation: sigma */}
              <path d="M 174 48 L 158 48 L 166 56 L 158 64 L 174 64" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* Delta: delta */}
              <path d="M 164 80 L 174 96 L 154 96 Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            {/* Slate mascot */}
            <g className="transition-transform duration-300">
              {/* Little feet */}
              <line x1="93" y1="80" x2="91" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="107" y1="80" x2="109" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />

              {/* Main Pill Body */}
              <rect x="84" y="34" width="32" height="48" rx="16" fill="#141414" />

              {/* Big Expressive Friendly Eyes */}
              <circle cx="93" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="94" cy="48" r="1.1" fill="#141414" />
              <circle cx="107" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="108" cy="48" r="1.1" fill="#141414" />

              {/* Curious slight smile */}
              <path d="M 97 58 Q 100 61 103 58" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />

              {/* Open welcoming / shrugging arms */}
              <path d="M 84 56 Q 70 54 66 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="65" cy="47" r="2.2" fill="#141414" />
              <path d="M 116 56 Q 130 54 134 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="135" cy="47" r="2.2" fill="#141414" />

              {/* Floating Speech Bubble */}
              <g className="anim-question-float">
                <rect x="112" y="12" width="46" height="22" rx="6" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" />
                <path d="M 118 34 L 116 39 L 124 34 Z" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" strokeLinejoin="round" />
                <text x="135" y="27" fill="#141414" fontSize="11" fontWeight="bold" fontFamily="'Space Grotesk', monospace" textAnchor="middle">empty!</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Messaging */}
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
            No Materials Available Yet
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-600 leading-relaxed">
            I don't have anything regarding this subject right now. If anyone has lecture slides, notes, assignments, or past papers, please share them with me and I will add them here!
          </p>
        </div>
      </div>
    );
  }

  if (isQuran) {
    return (
      <div className="bg-white border-2 border-[#141414] rounded-2xl p-6 sm:p-10 text-center max-w-lg w-full mx-auto shadow-[4px_4px_0px_#141414] space-y-5 my-8">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#141414] bg-[#FFF8F2] text-xs font-mono font-medium text-[#141414]">
          <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>UNDERSTANDING OF QURAN-I</span>
        </div>

        {/* Hand-Drawn Mascot Illustration with Quranic Manuscript & Stand Doodles */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 200 115" className="w-56 h-32 sm:w-64 sm:h-36 overflow-visible" fill="none">
            {/* Ground Shadow */}
            <ellipse cx="100" cy="98" rx="28" ry="4" fill="#F1F5F9" />

            {/* Left Doodles (Floating Manuscript & Motif) */}
            <g className="anim-math-float1">
              {/* Floating open manuscript */}
              <path d="M 28 42 C 34 38 42 45 48 41 L 48 64 C 42 68 34 61 28 65 Z" fill="#FFFBEB" stroke="#141414" strokeWidth="1.8" />
              <line x1="32" y1="50" x2="44" y2="50" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="32" y1="56" x2="42" y2="56" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />

              {/* Geometric Motif */}
              <polygon points="38,76 42,80 48,80 44,84 46,90 38,86 30,90 32,84 28,80 34,80" stroke="#64748B" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            </g>

            {/* Right Doodles (Traditional Book Stand / Rihal & Ink) */}
            <g className="anim-math-float2">
              {/* Wooden Rihal X-stand */}
              <path d="M 152 72 L 174 94 M 174 72 L 152 94" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" />
              <rect x="150" y="62" width="26" height="13" rx="2" fill="#FEF3C7" stroke="#141414" strokeWidth="1.6" />

              {/* Elegant scroll stroke */}
              <path d="M 166 38 C 160 44 162 52 158 58" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <circle cx="168" cy="36" r="2" fill="#64748B" />
            </g>

            {/* Slate mascot */}
            <g className="transition-transform duration-300">
              {/* Little feet */}
              <line x1="93" y1="80" x2="91" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="107" y1="80" x2="109" y2="95" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />

              {/* Main Pill Body */}
              <rect x="84" y="34" width="32" height="48" rx="16" fill="#141414" />

              {/* Big Expressive Friendly Eyes */}
              <circle cx="93" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="94" cy="48" r="1.1" fill="#141414" />
              <circle cx="107" cy="49" r="3" fill="#FFFFFF" />
              <circle cx="108" cy="48" r="1.1" fill="#141414" />

              {/* Curious slight smile */}
              <path d="M 97 58 Q 100 61 103 58" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />

              {/* Open welcoming / shrugging arms */}
              <path d="M 84 56 Q 70 54 66 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="65" cy="47" r="2.2" fill="#141414" />
              <path d="M 116 56 Q 130 54 134 48" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="135" cy="47" r="2.2" fill="#141414" />

              {/* Floating Speech Bubble */}
              <g className="anim-question-float">
                <rect x="96" y="10" width="84" height="24" rx="7" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" />
                <path d="M 116 34 L 112 40 L 122 34 Z" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" strokeLinejoin="round" />
                <text x="138" y="26" fill="#141414" fontSize="10.5" fontWeight="bold" fontFamily="'Space Grotesk', sans-serif" textAnchor="middle">no slides yet</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Messaging */}
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
            Awaiting Course Materials
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Week 01 had no class session. Week 02 covered the initial course intro, and Week 03 covered basic grammar. In Week 04, the course transitioned to Dr. Waqas Ahmed, who gave an introduction and outlined the updated syllabus. We haven't received official slides yet. If anyone took notes in class, please share them with us so we can add them here!
          </p>
        </div>
      </div>
    );
  }

  if (isCourseCard) {
    return (
      <div className="bg-white border-2 border-[#141414] rounded-2xl p-6 sm:p-10 text-center max-w-md w-full mx-auto shadow-[4px_4px_0px_#141414] space-y-4 my-6">
        {/* Animated Hand-Drawn Slate with Empty Clipboard & Floating Question */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 140 80" className="w-44 h-24 sm:w-52 sm:h-28 overflow-visible" fill="none">
            {/* Clipboard with paper outline */}
            <g className="transition-transform duration-500 ease-out hover:rotate-2">
              <rect x="26" y="18" width="32" height="44" rx="4" fill="#FFFBEB" stroke="#141414" strokeWidth="2" />
              <rect x="36" y="12" width="12" height="8" rx="2" fill="#141414" />
              <line x1="33" y1="29" x2="51" y2="29" stroke="#D97706" strokeWidth="1.6" strokeDasharray="3 2" />
              <line x1="33" y1="37" x2="51" y2="37" stroke="#D97706" strokeWidth="1.6" strokeDasharray="3 2" />
              <line x1="33" y1="45" x2="47" y2="45" stroke="#D97706" strokeWidth="1.6" strokeDasharray="3 2" />
            </g>

            {/* Slate mascot waiting impatiently */}
            <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
              <rect x="74" y="22" width="24" height="34" rx="12" fill="#141414" />
              <circle cx="81" cy="33" r="2.2" fill="#FFFFFF" />
              <circle cx="90" cy="33" r="2.2" fill="#FFFFFF" />
              <line x1="80" y1="56" x2="78" y2="68" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="91" y1="56" x2="93" y2="68" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
              {/* Question bubble with smooth float */}
              <g className="anim-question-float">
                <circle cx="108" cy="20" r="7.5" fill="#FEE2E2" stroke="#141414" strokeWidth="1.6" />
                <path d="M106 18 C106 16 110 16 110 18 C110 20 108 20 108 22" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="108" cy="24.5" r="0.9" fill="#DC2626" />
              </g>
            </g>
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
            Course Card Pending
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto">
            The CR was supposed to get the course card and lecture slides, but hasn't received them yet.
          </p>
        </div>
      </div>
    );
  }

  if (isNoClass) {
    return (
      <div className="bg-white border-2 border-[#141414] rounded-2xl p-6 sm:p-10 text-center max-w-md w-full mx-auto shadow-[4px_4px_0px_#141414] space-y-4 my-6">
        {/* Animated Hand-Drawn Slate Relaxing / Off Day with Floating Zzz directly above head */}
        <div className="flex justify-center py-2">
          <svg viewBox="0 0 140 80" className="w-44 h-24 sm:w-52 sm:h-28 overflow-visible" fill="none">
            {/* Wooden Study Desk / Bench with clean ink lines */}
            <rect x="18" y="52" width="104" height="6" rx="2" fill="#F8FAFC" stroke="#141414" strokeWidth="2" />
            <line x1="28" y1="58" x2="28" y2="74" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="112" y1="58" x2="112" y2="74" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="28" y1="67" x2="112" y2="67" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Cozy Pillow under head */}
            <rect x="30" y="44" width="22" height="9" rx="4" fill="#E0F2FE" stroke="#141414" strokeWidth="1.6" />
            <path d="M 33 48 Q 41 46 49 48" stroke="#93C5FD" strokeWidth="1" strokeLinecap="round" fill="none" />

            {/* Slate mascot sleeping peacefully on bench with gentle breathing */}
            <g className="anim-sleep-breathe">
              {/* Main Pill Body lying flat */}
              <rect x="42" y="36" width="46" height="18" rx="9" fill="#141414" />
              {/* Closed smiling eyes (happy curved arcs) */}
              <path d="M 52 45 Q 55 48 58 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 64 45 Q 67 48 70 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Little feet kicked up comfortably */}
              <path d="M 88 43 L 95 40" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 88 47 L 96 46" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Staggered Floating Zzz Sleep Smoke Particles directly above Slate's head */}
            <g className="anim-sleep-z1">
              <text x="56" y="30" fill="#3B82F6" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">z</text>
            </g>
            <g className="anim-sleep-z2">
              <text x="56" y="30" fill="#2563EB" fontSize="15" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Z</text>
            </g>
            <g className="anim-sleep-z3">
              <text x="56" y="30" fill="#1D4ED8" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Z</text>
            </g>
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
            No Class Held
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto">
            Class was not scheduled or did not take place this week.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-dashed border-neutral-300 rounded-2xl p-6 sm:p-10 text-center max-w-md w-full mx-auto space-y-2 my-6">
      <h3 className="font-['Space_Grotesk'] text-lg font-bold text-neutral-700">No Study Materials</h3>
      <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-neutral-500">No files uploaded for this week yet.</p>
    </div>
  );
}

// ============================================================================
// HASH & HISTORY ROUTING HELPERS (Issue 1: Back-Button & Direct Deep-Linking)
// ============================================================================
function buildHash(
  course: CourseItem | null,
  trail: FolderItem[],
  file?: { name: string } | null
): string {
  if (!course) return '#/';
  let hash = `#/course/${encodeURIComponent(course.code)}`;
  if (trail && trail.length > 0) {
    hash += '/' + trail.map((f) => encodeURIComponent(f.name)).join('/');
  }
  if (file && file.name) {
    hash += `?file=${encodeURIComponent(file.name)}`;
  }
  return hash;
}

function findFileInCourse(
  course: CourseItem,
  fileName: string
): { file: PreviewFile; trail: FolderItem[]; filesList: PreviewFile[] } | null {
  const targetLower = fileName.toLowerCase();
  const isClean = (name: string) =>
    !name.toLowerCase().includes('tracker') && !name.toLowerCase().includes('student');
  const cleanList = (files?: FileItem[]): PreviewFile[] =>
    (files || []).filter((f) => isClean(f.name)) as PreviewFile[];

  const rootFiles = cleanList(course.files);
  const rootMatch = rootFiles.find((f) => f.name.toLowerCase() === targetLower);
  if (rootMatch) {
    return { file: rootMatch, trail: [], filesList: rootFiles };
  }

  function searchFolder(
    folder: FolderItem,
    currentTrail: FolderItem[]
  ): { file: PreviewFile; trail: FolderItem[]; filesList: PreviewFile[] } | null {
    const nextTrail = [...currentTrail, folder];
    const files = cleanList(folder.files);
    const match = files.find((f) => f.name.toLowerCase() === targetLower);
    if (match) {
      return { file: match, trail: nextTrail, filesList: files };
    }
    if (folder.folders) {
      for (const sub of folder.folders) {
        const subResult = searchFolder(sub, nextTrail);
        if (subResult) return subResult;
      }
    }
    return null;
  }

  if (course.folders) {
    for (const f of course.folders) {
      const res = searchFolder(f, []);
      if (res) return res;
    }
  }

  return null;
}

function parseHash(
  hashStr: string,
  courses: CourseItem[]
): {
  course: CourseItem | null;
  trail: FolderItem[];
  file: PreviewFile | null;
  filesList: PreviewFile[];
} {
  const result = {
    course: null as CourseItem | null,
    trail: [] as FolderItem[],
    file: null as PreviewFile | null,
    filesList: [] as PreviewFile[],
  };

  const clean = (hashStr || '').replace(/^#\/?/, '').trim();
  if (!clean || !courses || courses.length === 0) {
    return result;
  }

  const [pathPart, queryPart] = clean.split('?');
  let targetFileName: string | null = null;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    targetFileName = params.get('file');
  }

  const safeDecode = (str: string) => {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  };
  const segments = pathPart.split('/').filter(Boolean).map(safeDecode);
  if (segments[0] === 'course' || segments[0] === 'courses') {
    segments.shift();
  }
  if (segments.length === 0) {
    return result;
  }

  const courseCode = segments[0].toLowerCase();
  const course = courses.find(
    (c) =>
      c.code.toLowerCase() === courseCode ||
      c.title.toLowerCase() === courseCode
  );
  if (!course) return result;
  result.course = course;

  const folderSegments = segments.slice(1);
  let currentLevel = course.folders || [];
  const trail: FolderItem[] = [];

  for (const seg of folderSegments) {
    const found = currentLevel.find(
      (f) => f.name.toLowerCase() === seg.toLowerCase()
    );
    if (found) {
      trail.push(found);
      currentLevel = found.folders || [];
    } else {
      break;
    }
  }
  result.trail = trail;

  const isClean = (name: string) =>
    !name.toLowerCase().includes('tracker') && !name.toLowerCase().includes('student');
  const activeFolder = trail.length > 0 ? trail[trail.length - 1] : null;
  const rawFiles = activeFolder ? (activeFolder.files || []) : (course.files || []);
  result.filesList = rawFiles.filter((f) => isClean(f.name)) as PreviewFile[];

  if (targetFileName) {
    const directMatch = result.filesList.find(
      (f) => f.name.toLowerCase() === targetFileName!.toLowerCase()
    );
    if (directMatch) {
      result.file = directMatch;
    } else {
      const fallback = findFileInCourse(course, targetFileName);
      if (fallback) {
        result.file = fallback.file;
        result.trail = fallback.trail;
        result.filesList = fallback.filesList;
      }
    }
  }

  return result;
}

export default function App() {
  const [data, setData] = useState<SemesterData>(INITIAL_DATA);
  const [activeCourse, setActiveCourse] = useState<CourseItem | null>(null);
  const [activeFolderTrail, setActiveFolderTrail] = useState<FolderItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [companionActive, setCompanionActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [previewFilesList, setPreviewFilesList] = useState<PreviewFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract all files recursively from a course with their breadcrumb path
  const getAllCourseFiles = useCallback((course: CourseItem) => {
    const results: Array<{
      file: FileItem;
      course: CourseItem;
      folderTrail: FolderItem[];
      allFolderFiles: FileItem[];
    }> = [];

    const traverse = (folders: FolderItem[], currentTrail: FolderItem[]) => {
      for (const folder of folders) {
        const nextTrail = [...currentTrail, folder];
        const folderFiles = (folder.files || []).filter((f) => !f.name.startsWith('.'));
        for (const file of folderFiles) {
          results.push({
            file,
            course,
            folderTrail: nextTrail,
            allFolderFiles: folderFiles,
          });
        }
        if (folder.folders && folder.folders.length > 0) {
          traverse(folder.folders, nextTrail);
        }
      }
    };

    if (course.files && course.files.length > 0) {
      const topFiles = course.files.filter((f) => !f.name.startsWith('.'));
      for (const file of topFiles) {
        results.push({
          file,
          course,
          folderTrail: [],
          allFolderFiles: topFiles,
        });
      }
    }

    if (course.folders && course.folders.length > 0) {
      traverse(course.folders, []);
    }

    return results;
  }, []);

  const handleOpenSearchResultFile = (result: {
    file: FileItem;
    course: CourseItem;
    folderTrail: FolderItem[];
    allFolderFiles: FileItem[];
  }) => {
    setActiveCourse(result.course);
    setActiveFolderTrail(result.folderTrail);
    handleOpenPreview(result.file, result.allFolderFiles, result.course, result.folderTrail);
  };

  // History sync refs
  const isHandlingHistoryChangeRef = useRef(false);
  const hasInternalPushRef = useRef(false);

  const updateUrl = useCallback(
    (
      course: CourseItem | null,
      trail: FolderItem[],
      file?: { name: string } | null,
      replace: boolean = false
    ) => {
      if (isHandlingHistoryChangeRef.current) return;
      const newHash = buildHash(course, trail, file);
      if (window.location.hash === newHash) return;
      if (replace) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.history.pushState(null, '', newHash);
      }
    },
    []
  );

  const syncStateFromHash = useCallback(() => {
    if (!data || !data.courses || data.courses.length === 0) return;
    const currentHash = window.location.hash;
    const parsed = parseHash(currentHash, data.courses);

    isHandlingHistoryChangeRef.current = true;
    setActiveCourse(parsed.course);
    setActiveFolderTrail(parsed.trail);
    setPreviewFile(parsed.file);
    if (parsed.filesList.length > 0) {
      setPreviewFilesList(parsed.filesList);
    }
    setTimeout(() => {
      isHandlingHistoryChangeRef.current = false;
    }, 60);
  }, [data]);

  // Sync state on popstate (browser back/forward button, swipe-to-back)
  useEffect(() => {
    window.addEventListener('popstate', syncStateFromHash);
    window.addEventListener('hashchange', syncStateFromHash);
    return () => {
      window.removeEventListener('popstate', syncStateFromHash);
      window.removeEventListener('hashchange', syncStateFromHash);
    };
  }, [syncStateFromHash]);

  // Sync on initial load when data arrives if a deep link hash exists
  useEffect(() => {
    if (data && data.courses && data.courses.length > 0) {
      if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
        syncStateFromHash();
      }
    }
  }, [data, syncStateFromHash]);

  // Mobile viewport safety: companion is strictly disabled on viewports < 768px
  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth < 768 && companionActive) {
        setCompanionActive(false);
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [companionActive]);

  const handleOpenPreview = (
    file: PreviewFile,
    filesList: PreviewFile[],
    overrideCourse?: CourseItem | null,
    overrideTrail?: FolderItem[]
  ) => {
    hasInternalPushRef.current = true;
    setPreviewFile(file);
    setPreviewFilesList(filesList);
    updateUrl(
      overrideCourse !== undefined ? overrideCourse : activeCourse,
      overrideTrail !== undefined ? overrideTrail : activeFolderTrail,
      file,
      false
    );
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewFilesList([]);
    if (window.location.hash.includes('?file=')) {
      if (hasInternalPushRef.current) {
        hasInternalPushRef.current = false;
        window.history.back();
      } else {
        updateUrl(activeCourse, activeFolderTrail, null, true);
      }
    }
  };

  // Dynamic Live Clock & Weekday System
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDayIndex = currentTime.getDay();
  const liveTodayKey = dayNames[currentDayIndex];
  const defaultDay = liveTodayKey === 'sunday' || liveTodayKey === 'saturday' ? 'monday' : liveTodayKey;
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);

  const weekdaysList = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
  const [animKey, setAnimKey] = useState<number>(0);

  const handleSelectDay = (day: string) => {
    if (day === selectedDay) return;
    setSelectedDay(day);
    setAnimKey((prev) => prev + 1);
  };

  // Formatted date in Apple / British style: e.g. "Thursday, 22 October"
  const formattedToday = (() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    return `${weekday}, ${day} ${month}`;
  })();

  // Fetch semester.json on load
  useEffect(() => {
    fetch('/semester.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.courses) setData(json);
      })
      .catch(() => {
        // Fallback to embedded INITIAL_DATA
      });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleDownload = async (file: { name: string; url: string }) => {
    triggerToast(`Downloading ${file.name}`);
    const host = import.meta.env.PROD ? 'https://api.tryaudrio.app' : '';
    const fullUrl = file.url.startsWith('http') ? file.url : `${host}${file.url}`;

    // 1. Check local on-disk cache first
    try {
      const cachedPdf = await getPdfFromDisk(fullUrl);
      if (cachedPdf) {
        const blob = new Blob([cachedPdf], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }

      const cachedText = await getTextFromDisk(fullUrl);
      if (cachedText) {
        const blob = new Blob([cachedText], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (e) {
      console.warn('Cache check before download failed:', e);
    }

    // 2. Fetch from network, prime the persistent offline cache, and trigger download
    try {
      const response = await fetch(fullUrl);
      if (response.ok) {
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || fullUrl.toLowerCase().endsWith('.pdf');
        const isText = /\.(md|txt|py|js|ts|json|c|cpp|h|html|css)$/i.test(file.name);

        if (isPdf) {
          const buffer = await response.arrayBuffer();
          // Write to persistent disk cache asynchronously so student can read offline later
          savePdfToDisk(fullUrl, buffer).catch((err) => console.warn('Academic cache error:', err));
          const blob = new Blob([buffer], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        } else if (isText) {
          const text = await response.text();
          saveTextToDisk(fullUrl, text).catch((err) => console.warn('Academic cache error:', err));
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        } else {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      }
    } catch (fetchErr) {
      console.warn('Network fetch before download failed, falling back to direct anchor:', fetchErr);
    }

    // 3. Direct anchor fallback
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Helper to count total files in a folder recursively
  const countFiles = (folder: FolderItem): number => {
    let count = (folder.files || []).length;
    if (folder.folders) {
      folder.folders.forEach((sub) => {
        count += countFiles(sub);
      });
    }
    return count;
  };

  const countCourseFiles = (course: CourseItem): number => {
    const rootFiles = (course.files || []).length;
    return rootFiles + course.folders.reduce((acc, f) => acc + countFiles(f), 0);
  };

  // Search memoized lists
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingCourses = useMemo(() => {
    if (!normalizedQuery) return [];
    return data.courses.filter(
      (c) =>
        c.title.toLowerCase().includes(normalizedQuery) ||
        c.code.toLowerCase().includes(normalizedQuery) ||
        c.instructor.toLowerCase().includes(normalizedQuery)
    );
  }, [data.courses, normalizedQuery]);

  const allAcademicFiles = useMemo(() => {
    return data.courses.flatMap((c) => getAllCourseFiles(c));
  }, [data.courses, getAllCourseFiles]);

  const matchingFiles = useMemo(() => {
    if (!normalizedQuery) return [];
    return allAcademicFiles.filter(
      (item) =>
        item.file.name.toLowerCase().includes(normalizedQuery) ||
        item.file.type.toLowerCase().includes(normalizedQuery) ||
        item.folderTrail.some((f) => f.name.toLowerCase().includes(normalizedQuery))
    );
  }, [allAcademicFiles, normalizedQuery]);


  // Timetable Live Calculations
  const isSelectedDayToday = selectedDay === liveTodayKey;

  const parseSlotMinutes = (timeStr: string) => {
    const parts = timeStr.split(' - ');
    if (parts.length < 2) return { start: 0, end: 0, startStr: timeStr, endStr: '' };
    const [startH, startM] = parts[0].trim().split(':').map(Number);
    const [endH, endM] = parts[1].trim().split(':').map(Number);
    return {
      start: (startH || 0) * 60 + (startM || 0),
      end: (endH || 0) * 60 + (endM || 0),
      startStr: parts[0].trim(),
      endStr: parts[1].trim(),
    };
  };

  const rawDaySlots = (data.timetable && data.timetable[selectedDay]) || [];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  let nextSlotFound = false;
  const processedSlots = rawDaySlots.map((slot) => {
    const { start, end, startStr, endStr } = parseSlotMinutes(slot.time);
    let dynamicStatus: 'completed' | 'live' | 'next' | 'upcoming' = 'upcoming';

    if (isSelectedDayToday) {
      if (currentMinutes >= end) {
        dynamicStatus = 'completed';
      } else if (currentMinutes >= start && currentMinutes < end) {
        dynamicStatus = 'live';
      } else if (!nextSlotFound) {
        dynamicStatus = 'next';
        nextSlotFound = true;
      } else {
        dynamicStatus = 'upcoming';
      }
    } else {
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const liveIdx = weekdays.indexOf(liveTodayKey);
      const selIdx = weekdays.indexOf(selectedDay);

      // On non-today days or weekends, lectures are strictly completed (if past weekday) or upcoming.
      // Never tag as 'next' or trigger active pulse indicators on future days or weekends.
      if (liveIdx !== -1 && selIdx !== -1 && selIdx < liveIdx) {
        dynamicStatus = 'completed';
      } else {
        dynamicStatus = 'upcoming';
      }
    }

    return {
      ...slot,
      dynamicStatus,
      startMinutes: start,
      endMinutes: end,
      startStr,
      endStr,
    };
  });

  const formatBreakDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} mins`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  const formatLectureDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins === 30) return `${hrs}.5 hrs`;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // Helper to format remaining time into human units (strictly Days, Hours, Minutes - NO SECONDS)
  const formatRelativeCountdown = (diffMinutes: number) => {
    const days = Math.floor(diffMinutes / (24 * 60));
    const remainingMinutes = diffMinutes % (24 * 60);
    const hrs = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    if (days > 0) {
      if (hrs > 0 && mins > 0) return `${days}d ${hrs}h ${mins}m`;
      if (hrs > 0) return `${days}d ${hrs}h`;
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} mins`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} min${mins > 1 ? 's' : ''}`;
  };

  // Find if any class is actively live right now (Issue 6: Live Lecture Radar)
  const currentLiveClass = (() => {
    if (!data.timetable) return null;
    const daySequence = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const todayKey = daySequence[currentDayIndex];
    const todaySlots = data.timetable[todayKey] || [];

    for (const rawSlot of todaySlots) {
      const { start, end, startStr, endStr } = parseSlotMinutes(rawSlot.time);
      if (currentMinutes >= start && currentMinutes < end) {
        return {
          slot: { ...rawSlot, startStr, endStr },
          dayKey: todayKey,
          remainingMinutes: end - currentMinutes,
        };
      }
    }
    return null;
  })();

  // Find the exact next chronological class across the weekly timetable
  const nextUpcomingClass = (() => {
    if (!data.timetable) return null;
    const daySequence = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

    for (let offset = 0; offset < 7; offset++) {
      const targetDayIdx = (currentDayIndex + offset) % 7;
      const targetDayKey = daySequence[targetDayIdx];
      const slots = data.timetable[targetDayKey] || [];

      for (const rawSlot of slots) {
        const { start, startStr, endStr } = parseSlotMinutes(rawSlot.time);
        if (offset === 0) {
          // Today: must be upcoming
          if (start > currentMinutes) {
            return {
              slot: { ...rawSlot, startStr, endStr },
              dayKey: targetDayKey,
              offsetDays: 0,
              diffMinutes: start - currentMinutes,
              isToday: true,
            };
          }
        } else {
          // Future day: first class encountered is next
          const diffMinutes = offset * 24 * 60 - currentMinutes + start;
          return {
            slot: { ...rawSlot, startStr, endStr },
            dayKey: targetDayKey,
            offsetDays: offset,
            diffMinutes,
            isToday: false,
          };
        }
      }
    }
    return null;
  })();

  type TimelineItem =
    | {
        type: 'slot';
        slot: (typeof processedSlots)[0];
        slotIndex: number;
        isFirst: boolean;
        isLast: boolean;
      }
    | {
        type: 'break';
        duration: number;
        startStr: string;
        endStr: string;
      };

  const timelineItems: TimelineItem[] = [];
  processedSlots.forEach((slot, idx) => {
    if (idx > 0) {
      const prev = processedSlots[idx - 1];
      const breakMinutes = slot.startMinutes - prev.endMinutes;
      if (breakMinutes >= 20) {
        timelineItems.push({
          type: 'break',
          duration: breakMinutes,
          startStr: prev.endStr,
          endStr: slot.startStr,
        });
      }
    }
    timelineItems.push({
      type: 'slot',
      slot,
      slotIndex: idx,
      isFirst: idx === 0,
      isLast: idx === processedSlots.length - 1,
    });
  });

  // Drill-down navigation helpers with History synchronization (Issue 1)
  const handleOpenCourse = (course: CourseItem) => {
    setActiveCourse(course);
    setActiveFolderTrail([]);
    setPreviewFile(null);
    updateUrl(course, [], null, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFolder = (folder: FolderItem) => {
    const nextTrail = [...activeFolderTrail, folder];
    setActiveFolderTrail(nextTrail);
    updateUrl(activeCourse, nextTrail, null, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (previewFile) {
      handleClosePreview();
      return;
    }
    if (activeFolderTrail.length > 0) {
      const nextTrail = activeFolderTrail.slice(0, activeFolderTrail.length - 1);
      setActiveFolderTrail(nextTrail);
      updateUrl(activeCourse, nextTrail, null, false);
    } else {
      setActiveCourse(null);
      setActiveFolderTrail([]);
      updateUrl(null, [], null, false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCleanFiles = (files?: FileItem[]) => {
    return (files || []).filter(
      (f) =>
        !f.name.toLowerCase().includes('tracker') &&
        !f.name.toLowerCase().includes('student')
    );
  };

  // Tree-aware data models for arbitrary folder/subfolder nesting
  interface CourseSection {
    folder: FolderItem;
    trail: FolderItem[];
    files: FileItem[];
    displayName: string;
  }

  interface CourseFileEntry {
    file: FileItem;
    fileIndex: number;
    totalFilesInFolder: number;
    folder: FolderItem;
    trail: FolderItem[];
    displayName: string;
  }

  // Canonical URL normalizer to prevent duplicate file name collisions across folders
  const normalizeUrl = (url?: string): string => {
    if (!url) return '';
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        return decodeURIComponent(parsed.pathname).toLowerCase().trim();
      }
    } catch {}
    return decodeURIComponent(url.split('?')[0].split('#')[0]).toLowerCase().trim();
  };

  // Robust file matcher that prioritizes canonical URLs and disambiguates duplicate file names by folder
  const isFileMatch = (
    entryFile: { url?: string; name: string },
    targetFile: { url?: string; name: string } | null,
    entryTrail?: FolderItem[],
    currentTrail?: FolderItem[]
  ): boolean => {
    if (!targetFile) return false;
    const normEntry = normalizeUrl(entryFile.url);
    const normTarget = normalizeUrl(targetFile.url);

    // 1. Primary & Exact: Canonical URL comparison
    if (normEntry && normTarget) {
      return normEntry === normTarget;
    }

    // 2. Secondary disambiguation: require BOTH name and folder to match!
    if (entryFile.name.toLowerCase() === targetFile.name.toLowerCase()) {
      if (entryTrail && currentTrail && entryTrail.length > 0 && currentTrail.length > 0) {
        const folderA = entryTrail[entryTrail.length - 1].name.toLowerCase();
        const folderB = currentTrail[currentTrail.length - 1].name.toLowerCase();
        return folderA === folderB;
      }
      return true;
    }

    return false;
  };

  // Collect all folder sections that contain files in a course (recursive DFS traversal)
  const collectCourseSections = (course: CourseItem): CourseSection[] => {
    const sections: CourseSection[] = [];

    const traverse = (folder: FolderItem, currentTrail: FolderItem[]) => {
      const newTrail = [...currentTrail, folder];
      const cleanFiles = getCleanFiles(folder.files);

      if (cleanFiles.length > 0) {
        sections.push({
          folder,
          trail: newTrail,
          files: cleanFiles,
          displayName: newTrail.map((f) => f.name).join(' / '),
        });
      }

      if (folder.folders && folder.folders.length > 0) {
        for (const sub of folder.folders) {
          traverse(sub, newTrail);
        }
      }
    };

    const rootFiles = getCleanFiles(course.files);
    if (rootFiles.length > 0) {
      sections.push({
        folder: { name: 'Root', files: rootFiles },
        trail: [],
        files: rootFiles,
        displayName: `${course.code} (Root)`,
      });
    }

    if (course.folders) {
      for (const f of course.folders) {
        traverse(f, []);
      }
    }

    return sections;
  };

  // Collect all files across all folders in a course in linear tree order
  const collectCourseFiles = (course: CourseItem): CourseFileEntry[] => {
    const sections = collectCourseSections(course);
    const allFiles: CourseFileEntry[] = [];

    for (const sec of sections) {
      for (let i = 0; i < sec.files.length; i++) {
        allFiles.push({
          file: sec.files[i],
          fileIndex: i,
          totalFilesInFolder: sec.files.length,
          folder: sec.folder,
          trail: sec.trail,
          displayName: sec.displayName,
        });
      }
    }

    return allFiles;
  };

  // 1. File Level (Ctrl + Arrow or Ctrl + >): Traverses every file in pre-order across arbitrary subfolders
  const handleNavigateFile = (direction: 'next' | 'prev') => {
    if (!activeCourse) {
      if (data.courses && data.courses.length > 0) {
        const targetCourse = direction === 'next' ? data.courses[0] : data.courses[data.courses.length - 1];
        setActiveCourse(targetCourse);
        const files = collectCourseFiles(targetCourse);
        if (files.length > 0) {
          const entry = direction === 'next' ? files[0] : files[files.length - 1];
          setActiveFolderTrail(entry.trail);
          setPreviewFilesList(entry.folder.files ? getCleanFiles(entry.folder.files) : [entry.file]);
          setPreviewFile(entry.file);
          triggerToast(`${entry.displayName} • ${entry.file.name}`);
        }
      }
      return;
    }

    const delta = direction === 'next' ? 1 : -1;
    const allCourseFiles = collectCourseFiles(activeCourse);

    if (allCourseFiles.length === 0) {
      handleNavigateCourse(direction, 'file');
      return;
    }

    let currentIdx = -1;
    if (previewFile) {
      currentIdx = allCourseFiles.findIndex((entry) =>
        isFileMatch(entry.file, previewFile, entry.trail, activeFolderTrail)
      );
    } else {
      // Preview modal is closed: determine start index from current folder or focused file
      if (activeFolderTrail.length > 0) {
        const curFolder = activeFolderTrail[activeFolderTrail.length - 1];
        if (keyboardIndex >= visibleFolders.length && keyboardIndex < visibleFolders.length + visibleFiles.length) {
          const focusedFile = visibleFiles[keyboardIndex - visibleFolders.length];
          currentIdx = allCourseFiles.findIndex((entry) =>
            isFileMatch(entry.file, focusedFile, entry.trail, activeFolderTrail)
          );
        } else {
          const folderIndices = allCourseFiles
            .map((entry, idx) => ({ entry, idx }))
            .filter(({ entry }) =>
              entry.folder.name.toLowerCase() === curFolder.name.toLowerCase() ||
              entry.trail.some((t) => t.name.toLowerCase() === curFolder.name.toLowerCase())
            );
          if (folderIndices.length > 0) {
            currentIdx = direction === 'next' ? folderIndices[0].idx - 1 : folderIndices[folderIndices.length - 1].idx + 1;
          }
        }
      }
    }

    let nextIdx = 0;
    if (currentIdx !== -1) {
      const targetIdx = currentIdx + delta;
      if (targetIdx >= 0 && targetIdx < allCourseFiles.length) {
        nextIdx = targetIdx;
      } else {
        // Traversed past this course boundary: step to next/prev course, landing on opposite file!
        handleNavigateCourse(direction, 'file');
        return;
      }
    } else {
      nextIdx = delta === 1 ? 0 : allCourseFiles.length - 1;
    }

    const targetEntry = allCourseFiles[nextIdx];
    setActiveFolderTrail(targetEntry.trail);
    const targetFolderFiles = targetEntry.folder.files
      ? getCleanFiles(targetEntry.folder.files)
      : [targetEntry.file];
    setPreviewFilesList(targetFolderFiles);
    setPreviewFile(targetEntry.file);
    updateUrl(activeCourse, targetEntry.trail, targetEntry.file, true);
    triggerToast(
      targetEntry.totalFilesInFolder > 1
        ? `${targetEntry.displayName} • ${targetEntry.file.name} (${targetEntry.fileIndex + 1}/${targetEntry.totalFilesInFolder})`
        : `${targetEntry.displayName} • ${targetEntry.file.name}`
    );
  };

  // 2. Folder Level (Alt + Arrow or Alt + >): Jumps between folder sections across arbitrary subfolders
  const handleNavigateFolder = (direction: 'next' | 'prev') => {
    if (!activeCourse) return;
    const delta = direction === 'next' ? 1 : -1;
    const sections = collectCourseSections(activeCourse);

    if (sections.length === 0) {
      triggerToast(`${activeCourse.code}: No file sections`);
      return;
    }

    let currentSecIdx = -1;
    if (previewFile) {
      currentSecIdx = sections.findIndex((sec) =>
        sec.files.some((f) =>
          isFileMatch(f, previewFile, sec.trail, activeFolderTrail)
        )
      );
    }
    if (currentSecIdx === -1 && activeFolderTrail.length > 0) {
      const currentFolder = activeFolderTrail[activeFolderTrail.length - 1];
      currentSecIdx = sections.findIndex(
        (sec) =>
          sec.folder.name.toLowerCase() === currentFolder.name.toLowerCase() ||
          sec.trail.some((tf) => tf.name.toLowerCase() === currentFolder.name.toLowerCase())
      );
    }

    let nextSecIdx = 0;
    if (currentSecIdx !== -1) {
      const targetSec = currentSecIdx + delta;
      if (targetSec >= 0 && targetSec < sections.length) {
        nextSecIdx = targetSec;
      } else {
        handleNavigateCourse(direction, 'folder');
        return;
      }
    } else {
      nextSecIdx = delta === 1 ? 0 : sections.length - 1;
    }

    const targetSection = sections[nextSecIdx];
    setActiveFolderTrail(targetSection.trail);

    if (previewFile) {
      setPreviewFilesList(targetSection.files);
      setPreviewFile(targetSection.files[0]);
      updateUrl(activeCourse, targetSection.trail, targetSection.files[0], true);
      triggerToast(`${targetSection.displayName} • ${targetSection.files[0].name}`);
    } else {
      updateUrl(activeCourse, targetSection.trail, null, true);
      triggerToast(`${targetSection.displayName}`);
    }
  };

  // 3. Subject Level (Shift + Arrow or Shift + >): Switches course and opens matching or first section
  const handleNavigateCourse = (
    direction: 'next' | 'prev',
    fromLevel: 'file' | 'folder' | 'course' = 'course'
  ) => {
    const courses = data.courses || [];
    if (courses.length === 0) return;
    const delta = direction === 'next' ? 1 : -1;

    let currentIndex = -1;
    if (activeCourse) {
      currentIndex = courses.findIndex(
        (c) => c.code.toLowerCase() === activeCourse.code.toLowerCase()
      );
    }

    let nextIndex = 0;
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + delta + courses.length) % courses.length;
    } else {
      nextIndex = delta === 1 ? 0 : courses.length - 1;
    }

    const targetCourse = courses[nextIndex];
    setActiveCourse(targetCourse);

    const sections = collectCourseSections(targetCourse);
    const allFiles = collectCourseFiles(targetCourse);

    if (sections.length === 0 || allFiles.length === 0) {
      setActiveFolderTrail([]);
      setPreviewFile(null);
      setPreviewFilesList([]);
      updateUrl(targetCourse, [], null, true);
      triggerToast(`${targetCourse.code}: ${targetCourse.title}`);
      return;
    }

    if (fromLevel === 'file') {
      // Crossing course boundary from file navigation:
      // forward lands on FIRST file; backward lands on LAST file
      const targetEntry = direction === 'next' ? allFiles[0] : allFiles[allFiles.length - 1];
      setActiveFolderTrail(targetEntry.trail);
      const targetFolderFiles = targetEntry.folder.files
        ? getCleanFiles(targetEntry.folder.files)
        : [targetEntry.file];
      setPreviewFilesList(targetFolderFiles);
      setPreviewFile(targetEntry.file);
      updateUrl(targetCourse, targetEntry.trail, targetEntry.file, true);
      triggerToast(
        targetEntry.totalFilesInFolder > 1
          ? `${targetCourse.code} • ${targetEntry.displayName} • ${targetEntry.file.name} (${targetEntry.fileIndex + 1}/${targetEntry.totalFilesInFolder})`
          : `${targetCourse.code} • ${targetEntry.displayName} • ${targetEntry.file.name}`
      );
      return;
    }

    if (fromLevel === 'folder') {
      // Crossing course boundary from folder navigation:
      // forward lands on FIRST folder; backward lands on LAST folder
      const targetSection = direction === 'next' ? sections[0] : sections[sections.length - 1];
      setActiveFolderTrail(targetSection.trail);
      if (previewFile) {
        setPreviewFilesList(targetSection.files);
        setPreviewFile(targetSection.files[0]);
        updateUrl(targetCourse, targetSection.trail, targetSection.files[0], true);
        triggerToast(`${targetCourse.code} • ${targetSection.displayName} • ${targetSection.files[0].name}`);
      } else {
        updateUrl(targetCourse, targetSection.trail, null, true);
        triggerToast(`${targetCourse.code} • ${targetSection.displayName}`);
      }
      return;
    }

    // fromLevel === 'course' (Shift + Arrow):
    if (previewFile) {
      // Match current week or section name if possible (e.g. Week 02)
      let matchedSection = sections[0];
      if (activeFolderTrail.length > 0) {
        const currentFolderName = activeFolderTrail[activeFolderTrail.length - 1].name.toLowerCase();
        const found = sections.find((sec) =>
          sec.trail.some((tf) => tf.name.toLowerCase() === currentFolderName)
        );
        if (found) {
          matchedSection = found;
        }
      }
      setActiveFolderTrail(matchedSection.trail);
      setPreviewFilesList(matchedSection.files);
      setPreviewFile(matchedSection.files[0]);
      updateUrl(targetCourse, matchedSection.trail, matchedSection.files[0], true);
      triggerToast(
        `${targetCourse.code} • ${matchedSection.displayName} • ${matchedSection.files[0].name}`
      );
    } else {
      // Preview modal is closed: keep user at course root (or matching folder if they were already inside one)
      if (activeFolderTrail.length > 0) {
        const currentFolderName = activeFolderTrail[activeFolderTrail.length - 1].name.toLowerCase();
        const found = sections.find((sec) =>
          sec.trail.some((tf) => tf.name.toLowerCase() === currentFolderName)
        );
        if (found) {
          setActiveFolderTrail(found.trail);
          updateUrl(targetCourse, found.trail, null, true);
          triggerToast(`${targetCourse.code} • ${found.displayName}`);
          return;
        }
      }
      setActiveFolderTrail([]);
      updateUrl(targetCourse, [], null, true);
      triggerToast(`${targetCourse.code}: ${targetCourse.title}`);
    }
  };

  // Current view content when drilled down
  const currentFolder =
    activeFolderTrail.length > 0
      ? activeFolderTrail[activeFolderTrail.length - 1]
      : null;

  const visibleFolders = useMemo(() => {
    return activeCourse
      ? (currentFolder ? currentFolder.folders || [] : activeCourse.folders || []).filter(
          (f) => (currentFolder ? countFiles(f) > 0 || (f.folders && f.folders.length > 0) : true)
        )
      : [];
  }, [activeCourse, currentFolder]);

  const visibleFiles = useMemo(() => {
    return activeCourse
      ? (
          (currentFolder ? currentFolder.files : activeCourse.files) || []
        ).filter(
          (f) =>
            !f.name.toLowerCase().includes('tracker') &&
            !f.name.toLowerCase().includes('student')
        )
      : [];
  }, [activeCourse, currentFolder]);

  // Model 1: Keyboard-driven Folder & File Navigation State
  const [keyboardIndex, setKeyboardIndex] = useState<number>(-1);

  // Reset focus whenever navigating into or out of courses/folders
  useEffect(() => {
    setKeyboardIndex(-1);
  }, [activeCourse, activeFolderTrail]);

  // Smoothly scroll keyboard-focused item into view at a comfortable, centered eye level
  useEffect(() => {
    if (keyboardIndex >= 0) {
      const el = document.querySelector('[data-keyboard-focused="true"]') as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const headerOffset = 90; // sticky header + safety breathing room
        const bottomOffset = 90;
        const viewportHeight = window.innerHeight;

        // If the element is already comfortably visible in the viewport, don't jerk the page
        const isComfortablyVisible =
          rect.top >= headerOffset &&
          rect.bottom <= viewportHeight - bottomOffset;

        if (!isComfortablyVisible) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  }, [keyboardIndex]);

  // Keyboard navigation: 2D Arrow Navigation, Enter to open, Backspace/Esc to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          Boolean(
            target.closest &&
              (target.closest('input') ||
                target.closest('textarea') ||
                target.closest('[contenteditable="true"]'))
          ));

      if (isInput) {
        if (e.key === 'Escape') {
          if (searchQuery) {
            setSearchQuery('');
          }
          if (searchInputRef.current) {
            searchInputRef.current.blur();
          }
        }
        return;
      }

      // Quick Search hotkeys ('/' or 'Ctrl+K' / 'Cmd+K')
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !previewFile) {
        e.preventDefault();
        if (activeCourse) {
          setActiveCourse(null);
          setActiveFolderTrail([]);
        }
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }, 10);
        return;
      }

      if (e.key === 'Escape' && searchQuery) {
        e.preventDefault();
        setSearchQuery('');
        return;
      }

      // Hierarchy shortcuts on main dashboard/folder view:
      // Ctrl (File), Alt (Week/Folder), Shift (Subject)
      // Supports ArrowLeft/ArrowRight, ArrowUp/ArrowDown, as well as , / < and . / >
      const isNextNav =
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === '.' ||
        e.key === '>';
      const isPrevNav =
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowUp' ||
        e.key === ',' ||
        e.key === '<';

      if (isNextNav || isPrevNav) {
        const direction = isNextNav ? 'next' : 'prev';
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          handleNavigateFile(direction);
          return;
        }
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          handleNavigateFolder(direction);
          return;
        }
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          handleNavigateCourse(direction, 'course');
          return;
        }
      }

      // 1. Backspace / Escape: Close preview, or step up folder, or return to courses
      if (e.key === 'Backspace' || e.key === 'Escape') {
        if (previewFile) {
          e.preventDefault();
          handleClosePreview();
          return;
        }
        if (activeFolderTrail.length > 0) {
          e.preventDefault();
          handleBack();
          setKeyboardIndex(-1);
          return;
        }
        if (activeCourse) {
          e.preventDefault();
          handleBack();
          setKeyboardIndex(-1);
          return;
        }
        if (keyboardIndex >= 0) {
          e.preventDefault();
          setKeyboardIndex(-1);
          return;
        }
      }

      // If file preview modal is open, don't move folders underneath
      if (previewFile) return;

      // 2. Navigation inside active course: Folders (2 cols) & Files (1 col)
      if (activeCourse) {
        const numFolders = visibleFolders.length;
        const numFiles = visibleFiles.length;
        const totalItems = numFolders + numFiles;
        if (totalItems === 0) return;

        const folderCols = window.innerWidth >= 640 ? 2 : 1;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(0);
          } else if (keyboardIndex < numFolders) {
            if (folderCols === 2) {
              const nextRow = keyboardIndex + 2;
              if (nextRow < numFolders) {
                setKeyboardIndex(nextRow);
              } else if (numFiles > 0) {
                setKeyboardIndex(numFolders); // drop into first file
              } else if (keyboardIndex + 1 < numFolders) {
                setKeyboardIndex(keyboardIndex + 1);
              } else {
                setKeyboardIndex(0); // wrap to top
              }
            } else {
              setKeyboardIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
            }
          } else {
            // In Files list
            setKeyboardIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(totalItems - 1);
          } else if (keyboardIndex < numFolders) {
            if (folderCols === 2) {
              const prevRow = keyboardIndex - 2;
              if (prevRow >= 0) {
                setKeyboardIndex(prevRow);
              } else if (numFiles > 0) {
                setKeyboardIndex(totalItems - 1); // wrap to last file
              } else {
                setKeyboardIndex(numFolders - 1);
              }
            } else {
              setKeyboardIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
            }
          } else if (keyboardIndex === numFolders) {
            // Top of files: jump up to last folder
            if (numFolders > 0) {
              setKeyboardIndex(numFolders - 1);
            } else {
              setKeyboardIndex(totalItems - 1);
            }
          } else {
            // In Files list
            setKeyboardIndex((prev) => prev - 1);
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(0);
          } else if (keyboardIndex < numFolders) {
            if (folderCols === 2 && keyboardIndex % 2 === 0 && keyboardIndex + 1 < numFolders) {
              setKeyboardIndex(keyboardIndex + 1);
            } else {
              setKeyboardIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
            }
          } else {
            setKeyboardIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(totalItems - 1);
          } else if (keyboardIndex < numFolders) {
            if (folderCols === 2 && keyboardIndex % 2 === 1) {
              setKeyboardIndex(keyboardIndex - 1);
            } else {
              setKeyboardIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
            }
          } else {
            setKeyboardIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          }
        } else if (e.key === 'Enter') {
          if (keyboardIndex >= 0 && keyboardIndex < totalItems) {
            e.preventDefault();
            if (keyboardIndex < numFolders) {
              handleOpenFolder(visibleFolders[keyboardIndex]);
            } else {
              const fileIdx = keyboardIndex - numFolders;
              handleOpenPreview(visibleFiles[fileIdx], visibleFiles);
            }
          }
        }
        return;
      }

      // 3. Navigation on home dashboard course cards (2-column responsive grid)
      if (!activeCourse && data.courses && data.courses.length > 0) {
        const totalCourses = data.courses.length;
        const cols = window.innerWidth >= 768 ? 2 : 1;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(0);
          } else if (cols === 2) {
            const nextRow = keyboardIndex + 2;
            if (nextRow < totalCourses) {
              setKeyboardIndex(nextRow);
            } else if (keyboardIndex % 2 === 0 && keyboardIndex + 1 < totalCourses) {
              setKeyboardIndex(keyboardIndex + 1);
            } else {
              setKeyboardIndex(keyboardIndex % 2); // wrap to top of same column
            }
          } else {
            setKeyboardIndex((prev) => (prev < totalCourses - 1 ? prev + 1 : 0));
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(totalCourses - 1);
          } else if (cols === 2) {
            const prevRow = keyboardIndex - 2;
            if (prevRow >= 0) {
              setKeyboardIndex(prevRow);
            } else {
              const remainder = keyboardIndex % 2;
              const lastInCol = totalCourses - 1 - ((totalCourses - 1) % 2) + remainder;
              setKeyboardIndex(lastInCol < totalCourses ? lastInCol : lastInCol - 2);
            }
          } else {
            setKeyboardIndex((prev) => (prev > 0 ? prev - 1 : totalCourses - 1));
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(0);
          } else if (cols === 2 && keyboardIndex % 2 === 0 && keyboardIndex + 1 < totalCourses) {
            setKeyboardIndex(keyboardIndex + 1);
          } else {
            setKeyboardIndex((prev) => (prev < totalCourses - 1 ? prev + 1 : 0));
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (keyboardIndex < 0) {
            setKeyboardIndex(totalCourses - 1);
          } else if (cols === 2 && keyboardIndex % 2 === 1) {
            setKeyboardIndex(keyboardIndex - 1);
          } else {
            setKeyboardIndex((prev) => (prev > 0 ? prev - 1 : totalCourses - 1));
          }
        } else if (e.key === 'Enter') {
          if (keyboardIndex >= 0 && keyboardIndex < totalCourses) {
            e.preventDefault();
            handleOpenCourse(data.courses[keyboardIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFile, activeFolderTrail, activeCourse, visibleFolders, visibleFiles, data.courses, keyboardIndex, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#141414] font-sans selection:bg-[#FFE600] selection:text-black flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
      {/* Toast Notification (Issue 17: Responsive bounds & truncation) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 max-w-sm sm:max-w-md mx-auto sm:mx-0 z-50 bg-[#141414] text-white text-xs font-mono px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border-2 border-[#141414] shadow-[3px_3px_0px_#FFE600] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#FF6D00] shrink-0 inline-block animate-ping" />
          <span className="truncate flex-1">✓ {toastMessage}</span>
        </div>
      )}

      {/* Interactive Cursor Companion Follower (Desktop only >= 768px; removed on mobile) */}
      {companionActive && typeof window !== 'undefined' && window.innerWidth >= 768 && (
        <SlateCursorCompanion onDismiss={() => setCompanionActive(false)} />
      )}

      {/* 1. MINIMALIST APPROVED HEADER (with iOS safe-area insets: Issue 9) */}
      <header className="bg-white border-b-2 border-[#141414] px-4 sm:px-6 lg:px-12 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 sm:pb-3.5 sticky top-0 z-40 shadow-xs pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Interactive Logo & Slate Mascot */}
          <InteractiveSlateLogo
            isCompanionActive={companionActive}
            onToggleCompanion={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                setCompanionActive((prev) => !prev);
              }
            }}
            onReset={() => {
              setActiveCourse(null);
              setActiveFolderTrail([]);
              setPreviewFile(null);
              updateUrl(null, [], null, false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Simple Date in Apple / British Format */}
          <div className="text-[11px] sm:text-xs font-mono font-medium text-neutral-500 shrink-0">
            {formattedToday}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1 w-full min-w-0">
        {/* ============================================================== */}
        {/* VIEW 1: HOME DASHBOARD (Radar + Course Cards)                 */}
        {/* ============================================================== */}
        {!activeCourse && (
          <>
            {/* PILLAR 1: LIVE TRANSIT TIMELINE */}
            <section className="bg-white border-2 border-[#141414] rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-[3px_3px_0px_#141414] space-y-4 sm:space-y-5 min-h-[300px]">
              {/* Header with Day Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <h2
                    className="font-bold text-base md:text-lg text-[#141414]"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {isSelectedDayToday
                      ? "Today's Schedule"
                      : `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Schedule`}
                  </h2>
                  <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                    {processedSlots.length} classes
                  </span>
                </div>

                {/* Sexy Sliding Segmented Day Switcher */}
                <div className="relative grid grid-cols-5 bg-neutral-100 p-0.5 sm:p-1 rounded-xl border border-neutral-200 w-full sm:w-72 select-none">
                  {/* The Fluid Sliding Dark Indicator Pill */}
                  <div
                    className="absolute top-1 bottom-1 rounded-lg bg-[#141414] shadow-xs pointer-events-none transition-transform duration-200 ease-out"
                    style={{
                      left: '4px',
                      width: 'calc((100% - 8px) / 5)',
                      transform: `translateX(${weekdaysList.indexOf(selectedDay as any) * 100}%)`,
                    }}
                  />

                  {weekdaysList.map((day) => {
                    const isSelected = selectedDay === day;
                    const isToday = liveTodayKey === day;
                    const label = day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3);

                    return (
                      <button
                        key={day}
                        onClick={() => handleSelectDay(day)}
                        className={`relative z-10 min-h-[42px] sm:min-h-[36px] py-2 sm:py-1.5 px-0.5 sm:px-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'text-white'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {isToday && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FF6D00]"
                            title="Today"
                          />
                        )}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class Radar (Live Ongoing Lecture or Next Class Countdown: Issue 6) */}
              {currentLiveClass ? (
                <div
                  onClick={() => handleSelectDay(currentLiveClass.dayKey)}
                  className="bg-emerald-50/90 hover:bg-emerald-100/90 border-2 border-[#141414] rounded-xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_#141414] hover:shadow-[3.5px_3.5px_0px_#141414] transition-all cursor-pointer group select-none min-w-0"
                  title="Click to jump to today's schedule"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                    </span>
                    <div className="text-xs min-w-0 flex-1 leading-snug">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 border border-emerald-400/50 px-1.5 py-0.5 rounded-sm">
                          Live Now
                        </span>
                        <span className="font-bold text-sm text-[#141414] group-hover:text-emerald-900 transition-colors truncate">
                          {currentLiveClass.slot.title}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Started at {currentLiveClass.slot.startStr}</span>
                        <span>•</span>
                        <span className="text-emerald-800 font-bold">Ends in {formatLectureDuration(currentLiveClass.remainingMinutes)}</span>
                        {nextUpcomingClass && (
                          <>
                            <span className="text-neutral-400 hidden xs:inline">•</span>
                            <span className="text-neutral-500 hidden xs:inline truncate">
                              Up next: {nextUpcomingClass.slot.title} ({nextUpcomingClass.slot.startStr})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[#141414] bg-white border-2 border-[#141414] px-2.5 py-1 rounded-lg shadow-[1.5px_1.5px_0px_#141414]">
                      {currentLiveClass.slot.room}
                    </span>
                  </div>
                </div>
              ) : nextUpcomingClass ? (
                <div
                  onClick={() => handleSelectDay(nextUpcomingClass.dayKey)}
                  className="bg-neutral-50/90 hover:bg-neutral-100/90 border border-neutral-200/90 rounded-xl p-3 sm:px-3.5 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all cursor-pointer group select-none min-w-0"
                  title="Click to jump to this day's schedule"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF6D00] shrink-0 animate-pulse" />
                    <div className="text-xs min-w-0 flex-1 leading-snug">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-neutral-500 font-medium shrink-0">Next:</span>
                        <span className="font-bold text-[#141414] group-hover:text-[#FF6D00] transition-colors truncate">
                          {nextUpcomingClass.slot.title}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500 mt-0.5 truncate">
                        {nextUpcomingClass.isToday
                          ? `Today at ${nextUpcomingClass.slot.startStr}`
                          : nextUpcomingClass.offsetDays === 1
                          ? `Tomorrow at ${nextUpcomingClass.slot.startStr}`
                          : `${nextUpcomingClass.dayKey.charAt(0).toUpperCase() + nextUpcomingClass.dayKey.slice(1)} at ${nextUpcomingClass.slot.startStr}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="font-mono font-bold text-[11px] sm:text-xs text-[#FF6D00] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                      in {formatRelativeCountdown(nextUpcomingClass.diffMinutes)}
                    </span>
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[#141414] bg-white border border-neutral-300 px-2 py-0.5 rounded-md shadow-2xs">
                      {nextUpcomingClass.slot.room}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Transit Timeline Flow with Calm Dissolve Transition */}
              <div key={animKey} className="space-y-3 anim-fade-in">
                {timelineItems.map((item, itemIdx) => {
                  if (item.type === 'break') {
                    return (
                      <div key={`break-${itemIdx}`} className="flex items-center gap-2 sm:gap-4">
                        {/* Timeline Rail Track segment (Issue 21: Seamless continuous transit line) */}
                        <div className="w-5 sm:w-8 shrink-0 flex items-center justify-center relative self-stretch">
                          <div className="absolute -top-3 -bottom-3 left-1/2 -translate-x-1/2 w-0.5 bg-neutral-200 z-0" />
                          <span className="w-2 h-0.5 bg-neutral-400 block relative z-10 rounded-full" />
                        </div>

                        {/* Break Pill */}
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-100/90 border border-neutral-200 text-xs text-neutral-600 shadow-2xs max-w-full">
                          <svg
                            className="w-3.5 h-3.5 text-neutral-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <polyline points="12 7 12 12 15 14" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="font-mono font-medium text-xs text-neutral-600">
                            {item.startStr} &ndash; {item.endStr}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-neutral-300" />
                          <span className="font-semibold text-neutral-700">
                            {formatBreakDuration(item.duration)} Break
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const slot = item.slot;
                  const status = slot.dynamicStatus;
                  const isLive = status === 'live';
                  const isNext = status === 'next';
                  const isDone = status === 'completed';

                  return (
                    <div key={`slot-${item.slotIndex}`} className="flex items-center gap-2 sm:gap-4 min-w-0">
                      {/* Timeline Rail Node */}
                      <div className="w-5 sm:w-8 shrink-0 flex items-center justify-center relative self-stretch">
                        {/* Vertical line connecting up/down */}
                        {!item.isFirst && (
                          <div className="absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 w-0.5 bg-neutral-200 z-0" />
                        )}
                        {!item.isLast && (
                          <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-neutral-200 z-0" />
                        )}

                        {/* Node */}
                        <div
                          className={`relative flex items-center justify-center rounded-full transition-all z-10 ${
                            isLive
                              ? 'w-5 h-5 bg-emerald-500 ring-4 ring-emerald-500/25'
                              : isNext
                              ? 'w-5 h-5 bg-[#FF6D00] ring-4 ring-[#FF6D00]/25'
                              : isDone
                              ? 'w-4 h-4 bg-neutral-200 ring-4 ring-white'
                              : 'w-3.5 h-3.5 border-2 border-neutral-300 bg-white ring-4 ring-white'
                          }`}
                        >
                          {isDone ? (
                            <svg
                              className="w-2.5 h-2.5 text-neutral-600 stroke-[3.5]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (isLive || isNext) ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                          ) : null}
                        </div>
                      </div>

                      {/* Content Card */}
                      <div
                        className={`flex-1 rounded-xl p-3 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0 ${
                          isLive
                            ? 'bg-[#F0FDF4] border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414]'
                            : isNext
                            ? 'bg-[#FFF8F2] border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414]'
                            : isDone
                            ? 'bg-neutral-50/70 border border-neutral-200 hover:border-neutral-300'
                            : 'bg-white border-2 border-neutral-200 hover:border-[#141414]'
                        }`}
                      >
                        {/* Left Side: Time + Subject Info */}
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          {/* Time Column with Unified Duration */}
                          <div className="shrink-0 text-left min-w-[68px] sm:min-w-[76px]">
                            <span
                              className={`block font-mono font-bold text-xs ${
                                isLive
                                  ? 'text-emerald-700'
                                  : isNext
                                  ? 'text-[#FF6D00]'
                                  : isDone
                                  ? 'text-neutral-500'
                                  : 'text-[#141414]'
                              }`}
                            >
                              {slot.startStr}
                            </span>
                            <span className="block font-mono text-[11px] sm:text-xs text-neutral-600 font-medium">
                              {slot.endStr}
                            </span>
                            <span
                              className={`inline-block mt-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                isLive
                                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                                  : isNext
                                  ? 'bg-orange-100/70 border-orange-200 text-[#FF6D00]'
                                  : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                              }`}
                            >
                              {formatLectureDuration(slot.endMinutes - slot.startMinutes)}
                            </span>
                          </div>

                          {/* Subtle vertical separator */}
                          <div
                            className={`w-px h-8 shrink-0 ${
                              isLive
                                ? 'bg-emerald-200'
                                : isNext
                                ? 'bg-orange-200'
                                : 'bg-neutral-200'
                            }`}
                          />

                          {/* Subject & Instructor */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h3
                                className={`font-bold text-xs sm:text-sm leading-snug break-words ${
                                  isDone ? 'text-neutral-700' : 'text-[#141414]'
                                }`}
                              >
                                {slot.title}
                              </h3>
                              {isLive && (
                                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
                                  Happening Now
                                </span>
                              )}
                              {isNext && (
                                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-[#FF6D00] text-white px-2.5 py-0.5 rounded-full inline-flex items-center shrink-0">
                                  Up Next
                                </span>
                              )}
                              {isDone && (
                                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-neutral-500 shrink-0">
                                  Completed
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 truncate">
                              {slot.instructor}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: High-Visibility Destination Room Tag */}
                        <div className="flex items-center justify-end shrink-0 sm:self-center">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-mono text-[11px] sm:text-xs font-bold transition-all ${
                              isLive
                                ? 'bg-emerald-900 text-white shadow-xs'
                                : isNext
                                ? 'bg-[#141414] text-white shadow-xs'
                                : isDone
                                ? 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                : 'bg-neutral-50 text-neutral-700 border border-neutral-300'
                            }`}
                            title={`Room: ${slot.room}`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isLive
                                  ? 'text-emerald-400'
                                  : isNext
                                  ? 'text-[#FF6D00]'
                                  : 'text-neutral-400'
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{slot.room}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Quiet note for days with early dismissals */}
                {selectedDay === 'tuesday' && (
                  <div className="flex items-center gap-3 sm:gap-4 pt-1">
                    <div className="w-6 sm:w-8 shrink-0 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                    </div>
                    <div className="text-xs font-mono text-neutral-400 py-1">
                      Free Afternoon &bull; No more classes scheduled
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* PILLAR 2: COURSES & NOTES (Issue 20: Instant Search & Filter) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h2
                    className="font-bold text-base md:text-lg text-[#141414]"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    Courses
                  </h2>
                  <span className="text-xs font-mono font-bold text-neutral-600 bg-white border border-[#141414] px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#141414]">
                    {data.courses.length} courses
                  </span>
                </div>

                {/* Neo-brutalist Instant Quick Search Bar */}
                <div className="relative w-full sm:w-80">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses, folders, slides... (/)"
                    aria-label="Search courses and study materials"
                    className="w-full bg-white border-2 border-[#141414] rounded-xl px-3.5 py-2 pl-9 pr-9 text-xs sm:text-sm font-medium text-[#141414] placeholder:text-neutral-400 focus:outline-none shadow-[2px_2px_0px_#141414] focus:shadow-[3.5px_3.5px_0px_#141414] transition-all"
                  />
                  <svg
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#141414] p-1 font-mono text-xs rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Clear search (Esc)"
                    >
                      ✕
                    </button>
                  ) : (
                    <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-neutral-400 border border-neutral-300 rounded px-1.5 py-0.5 bg-neutral-50 pointer-events-none">
                      /
                    </span>
                  )}
                </div>
              </div>

              {/* Search Active State */}
              {normalizedQuery ? (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Results Count & Clear Header */}
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pb-1 border-b border-neutral-200">
                    <span>
                      Found {matchingCourses.length} {matchingCourses.length === 1 ? 'course' : 'courses'} and {matchingFiles.length} {matchingFiles.length === 1 ? 'file' : 'files'}
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-[#141414] underline cursor-pointer font-bold"
                    >
                      Clear search (Esc)
                    </button>
                  </div>

                  {/* Empty Search State */}
                  {matchingCourses.length === 0 && matchingFiles.length === 0 && (
                    <div className="bg-white border-2 border-[#141414] rounded-2xl p-8 sm:p-12 text-center shadow-[3px_3px_0px_#141414] space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 border-2 border-[#141414] flex items-center justify-center text-lg font-mono font-bold">
                        ?
                      </div>
                      <h3 className="font-bold text-base text-[#141414]">No study materials found</h3>
                      <p className="text-xs text-neutral-500 font-mono max-w-sm mx-auto">
                        No courses, folders, or documents matched &ldquo;{searchQuery}&rdquo;. Try another keyword like &ldquo;lab&rdquo;, &ldquo;physics&rdquo;, or &ldquo;lecture&rdquo;.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="px-4 py-2 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_#FFE600] active:scale-95"
                        >
                          Clear Search
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Matching Courses */}
                  {matchingCourses.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                        Matching Courses ({matchingCourses.length})
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matchingCourses.map((course) => {
                          const totalFiles = countCourseFiles(course);
                          return (
                            <div
                              key={course.code}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                handleOpenCourse(course);
                                setKeyboardIndex(-1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenCourse(course);
                                  setKeyboardIndex(-1);
                                }
                              }}
                              className="border-2 border-[#141414] rounded-xl p-4 shadow-[2.5px_2.5px_0px_#141414] hover:shadow-[4px_4px_0px_#141414] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                              style={{ backgroundColor: course.tint }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[#141414] bg-white border border-[#141414] px-1.5 py-0.5 rounded shadow-2xs">
                                    {course.code}
                                  </span>
                                  <span className="text-xs text-neutral-600 truncate">
                                    {course.instructor}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-[#141414] mt-1 truncate group-hover:text-[#FF6D00] transition-colors">
                                  {course.title}
                                </h4>
                                <span className="text-[11px] font-mono text-neutral-600 mt-0.5 block">
                                  {totalFiles} {totalFiles === 1 ? 'file' : 'files'} available
                                </span>
                              </div>
                              <span className="text-xs font-bold font-mono px-3 py-1.5 bg-[#141414] text-white rounded-lg shrink-0 group-hover:translate-x-0.5 transition-transform">
                                Open →
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matching Files across All Courses */}
                  {matchingFiles.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                        Matching Files & Documents ({matchingFiles.length})
                      </span>
                      <div className="space-y-2">
                        {matchingFiles.map((res, matchIdx) => (
                          <div
                            key={`${res.course.code}-${res.file.name}-${matchIdx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenSearchResultFile(res)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenSearchResultFile(res);
                              }
                            }}
                            className="bg-white border-2 border-[#141414] rounded-xl p-3 sm:p-3.5 px-3.5 sm:px-4 shadow-[2px_2px_0px_#141414] hover:shadow-[3.5px_3.5px_0px_#141414] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-[#141414] flex items-center justify-center shrink-0">
                                <FileIllustration type={res.file.type} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs sm:text-sm block truncate text-[#141414] group-hover:text-[#FF6D00] transition-colors">
                                  {res.file.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono mt-0.5 flex-wrap">
                                  <span className="font-bold text-neutral-700 bg-neutral-100 border border-neutral-300 px-1.5 py-0.2 rounded">
                                    {res.course.code}
                                  </span>
                                  {res.folderTrail.length > 0 && (
                                    <span className="truncate max-w-[200px] sm:max-w-none text-neutral-600">
                                      {res.folderTrail.map((f) => f.name).join(' / ')}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{res.file.size}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSearchResultFile(res);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-[#141414] bg-white text-[#141414] hover:bg-neutral-100 transition-all shadow-[1px_1px_0px_#141414] active:scale-95 cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(res.file);
                                }}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#141414] text-white hover:bg-neutral-800 transition-all shadow-[1px_1px_0px_rgba(0,0,0,0.3)] active:scale-95 cursor-pointer"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Course Cards Grid (Rendered when no search query active) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.courses.map((course, idx) => {
                  const totalFiles = countCourseFiles(course);
                  const isFocused = !activeCourse && keyboardIndex === idx;

                  return (
                    <div
                      key={course.code}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open course ${course.title} (${course.code})`}
                      data-keyboard-focused={isFocused ? 'true' : undefined}
                      onClick={() => {
                        handleOpenCourse(course);
                        setKeyboardIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenCourse(course);
                          setKeyboardIndex(-1);
                        }
                      }}
                      className={`border-2 border-[#141414] rounded-2xl p-5 space-y-4 shadow-[3px_3px_0px_#141414] hover:shadow-[4px_4px_0px_#141414] transition-all cursor-pointer group flex flex-col justify-between focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#141414] focus-visible:ring-offset-2 focus-visible:scale-[1.01] ${
                        isFocused ? 'ring-3 ring-[#141414] ring-offset-2 scale-[1.01]' : ''
                      }`}
                      style={{ backgroundColor: course.tint }}
                    >
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-neutral-600 font-medium truncate max-w-[170px] sm:max-w-none">
                            {course.instructor}
                          </span>
                          <span
                            className="text-xs font-bold shrink-0"
                            style={{ fontFamily: '"Caveat", cursive', color: course.accent, fontSize: '15px' }}
                          >
                            {(() => {
                              const fCount = course.folders.filter((f) => countFiles(f) > 0 || (f.folders && f.folders.length > 0)).length;
                              return `[ ${fCount} ${fCount === 1 ? 'Folder' : 'Folders'} • ${totalFiles} ${totalFiles === 1 ? 'File' : 'Files'} ]`;
                            })()}
                          </span>
                        </div>

                        {/* Title & Doodle */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div>
                            <h3
                              className="text-lg font-bold text-[#141414]"
                              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                            >
                              {course.title}
                            </h3>
                          </div>

                          <div className="bg-white/80 border border-black/15 rounded-lg p-1 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <CourseDoodle code={course.code} />
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-2 border-t border-black/10 flex justify-end text-xs">
                        <span
                          className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                          style={{ color: course.accent }}
                        >
                          Open →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </section>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: APPLE-STYLE HIERARCHICAL DRILL-DOWN                   */}
        {/* ============================================================== */}
        {activeCourse && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Navigation Row: Neo-Brutalist Tactile Back Button + Interactive Floating Breadcrumbs */}
            <div className="flex items-center justify-between gap-3 px-0.5">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] hover:shadow-[3px_3px_0px_#141414] hover:-translate-x-0.5 transition-all text-xs font-bold text-[#141414] cursor-pointer active:scale-95 group max-w-full truncate"
                title="Go back (Backspace)"
              >
                <span className="text-sm font-mono group-hover:-translate-x-0.5 transition-transform shrink-0">←</span>
                <span className="truncate">
                  {activeFolderTrail.length > 0
                    ? `Back to ${activeFolderTrail.length === 1 ? activeCourse.title : activeFolderTrail[activeFolderTrail.length - 2].name}`
                    : 'All Courses'}
                </span>
              </button>

              {/* Breadcrumb Path in Mono */}
              <div className="text-xs font-mono text-neutral-500 hidden sm:flex items-center gap-1.5 select-none">
                <button
                  onClick={() => {
                    setActiveCourse(null);
                    setActiveFolderTrail([]);
                    setPreviewFile(null);
                    updateUrl(null, [], null, false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#141414] hover:underline transition-colors"
                >
                  courses
                </button>
                <span>/</span>
                <button
                  onClick={() => {
                    setActiveFolderTrail([]);
                    setPreviewFile(null);
                    updateUrl(activeCourse, [], null, false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`transition-colors ${
                    activeFolderTrail.length === 0
                      ? 'font-bold text-[#141414]'
                      : 'hover:text-[#141414] hover:underline'
                  }`}
                >
                  {activeCourse.title}
                </button>
                {activeFolderTrail.map((f, i) => {
                  const isLast = i === activeFolderTrail.length - 1;
                  return (
                    <span key={i} className="flex items-center gap-1.5">
                      <span>/</span>
                      <button
                        onClick={() => {
                          if (!isLast) {
                            const nextTrail = activeFolderTrail.slice(0, i + 1);
                            setActiveFolderTrail(nextTrail);
                            setPreviewFile(null);
                            updateUrl(activeCourse, nextTrail, null, false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`transition-colors ${
                          isLast
                            ? 'font-bold text-[#141414]'
                            : 'hover:text-[#141414] hover:underline'
                        }`}
                      >
                        {f.name}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Course Header Banner (hidden on Recommendations for a clean, spacious page) */}
            {!currentFolder?.name.toLowerCase().includes('recommend') && (
              <div
                className="border-2 border-[#141414] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#141414] flex items-center justify-between gap-3 min-w-0"
                style={{ backgroundColor: activeCourse.tint }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-neutral-600 font-medium mb-1 truncate">
                    {activeCourse.instructor}
                  </div>
                  <h1
                    className="text-base sm:text-xl md:text-2xl font-bold text-[#141414] leading-tight break-words"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {currentFolder ? currentFolder.name : activeCourse.title}
                  </h1>
                </div>

                <div className="bg-white/90 border border-black/15 rounded-xl p-1.5 shrink-0 shadow-xs group cursor-pointer hover:shadow-[2px_2px_0px_#141414] transition-all">
                  <CourseDoodle code={activeCourse.code} />
                </div>
              </div>
            )}

            {/* If inside Recommendations folder, render Slate's Clean Recommendation Hero UI */}
            {currentFolder && currentFolder.name.toLowerCase().includes('recommend') && (
              <RecommendationView courseCode={activeCourse.code} />
            )}

            {/* Subfolders List */}
            {visibleFolders.length > 0 && (
              <div className="space-y-2">
                <span
                  className="text-xs font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '15px' }}
                >
                  Folders
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleFolders.map((folder, idx) => {
                    const isFocused = activeCourse && keyboardIndex === idx;
                    return (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open folder ${folder.name}`}
                        data-keyboard-focused={isFocused ? 'true' : undefined}
                        onClick={() => {
                          handleOpenFolder(folder);
                          setKeyboardIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenFolder(folder);
                            setKeyboardIndex(-1);
                          }
                        }}
                        className={`bg-white border-2 border-[#141414] rounded-xl p-3 sm:p-3.5 px-3.5 sm:px-4 shadow-[2px_2px_0px_#141414] hover:shadow-[3px_3px_0px_#141414] transition-all cursor-pointer flex items-center justify-between gap-3 group min-w-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#141414] focus-visible:ring-offset-2 focus-visible:scale-[1.01] ${
                          isFocused ? 'ring-3 ring-[#141414] ring-offset-2 scale-[1.01]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50/70 border-2 border-[#141414] shadow-[1.5px_1.5px_0px_#141414] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-1 transition-all">
                            <FolderIllustration name={folder.name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs sm:text-sm block truncate text-[#141414] group-hover:text-[#FF6D00] transition-colors">
                              {folder.name}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono block truncate">
                              {folder.name.toLowerCase().includes('recommend')
                                ? 'Developer Pick'
                                : (() => {
                                    const fc = countFiles(folder);
                                    return fc === 0 ? 'Empty' : `${fc} ${fc === 1 ? 'file' : 'files'} inside`;
                                  })()}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-neutral-400 group-hover:text-[#141414] transition-colors shrink-0">
                          →
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files List (filtered to exclude internal tracking and private files) */}
            {visibleFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span
                  className="text-xs font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '15px' }}
                >
                  {currentFolder && currentFolder.name.toLowerCase().includes('recommend')
                    ? 'Companion Files & Notes'
                    : 'Downloadable Files'}
                </span>

                <div className="space-y-2">
                  {visibleFiles.map((file, idx) => {
                    const isFocused = activeCourse && keyboardIndex === (visibleFolders.length + idx);
                    return (
                      <div
                        key={idx}
                        data-keyboard-focused={isFocused ? 'true' : undefined}
                        onClick={() => handleOpenPreview(file, visibleFiles)}
                        className={`bg-white border-2 border-[#141414] rounded-xl p-3 sm:p-3.5 px-3.5 sm:px-4 shadow-[2px_2px_0px_#141414] hover:shadow-[3.5px_3.5px_0px_#141414] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${
                          isFocused ? 'ring-3 ring-[#141414] ring-offset-2 scale-[1.01]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50/60 border-2 border-[#141414] shadow-[1.5px_1.5px_0px_#141414] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-amber-100/90 group-hover:shadow-[2.5px_2.5px_0px_#141414] transition-all duration-200">
                            <FileIllustration type={file.type} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs sm:text-sm block truncate text-[#141414] group-hover:text-[#FF6D00] transition-colors" title={file.name}>
                              {file.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                                {file.type}
                              </span>
                              <span className="text-[11px] text-neutral-500 font-mono">
                                {file.size}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t border-neutral-100 sm:border-0 justify-end w-full sm:w-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(file, visibleFiles);
                            }}
                            className="flex-1 sm:flex-none px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-white border-2 border-[#141414] text-[#141414] hover:bg-neutral-100 transition-all shadow-[1px_1px_0px_#141414] active:scale-95 text-center min-h-[44px] sm:min-h-[36px] flex items-center justify-center cursor-pointer touch-manipulation"
                            title="Open preview in browser"
                          >
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            className="flex-1 sm:flex-none px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-[#141414] text-white hover:bg-neutral-800 transition-all shadow-[1px_1px_0px_rgba(0,0,0,0.3)] active:scale-95 text-center min-h-[44px] sm:min-h-[36px] flex items-center justify-center cursor-pointer touch-manipulation"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty Folder State */}
            {!currentFolder?.name.toLowerCase().includes('recommend') &&
              ((currentFolder ? currentFolder.folders : activeCourse.folders) || []).length === 0 &&
              ((currentFolder ? currentFolder.files : activeCourse.files) || []).length === 0 && (
                <EmptyFolderSlate
                  folderName={currentFolder ? currentFolder.name : ''}
                  courseCode={activeCourse.code}
                  courseTitle={activeCourse.title}
                />
              )}
          </div>
        )}
      </main>

      {/* 3. PERSONAL MINIMAL FOOTER */}
      <footer className="border-t-2 border-[#141414] bg-white mt-auto py-4 sm:py-5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center text-center">
          <div className="group inline-flex items-center gap-2 select-none cursor-default">
            <span
              className="text-neutral-700 tracking-wide text-lg sm:text-xl"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '22px' }}
            >
              built by saim &amp; run by slate
            </span>
            <svg
              viewBox="0 0 44 42"
              className="w-6 h-7 sm:w-7 sm:h-8 inline-block overflow-visible shrink-0 transition-transform duration-200 group-hover:-translate-y-1.5 group-hover:rotate-2"
              fill="none"
              aria-hidden="true"
            >
              {/* Little feet */}
              <line x1="13" y1="28" x2="11" y2="37" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="23" y1="28" x2="25" y2="37" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" className="group-hover:slate-waving-foot-active" />

              {/* Left resting arm */}
              <line x1="8" y1="17" x2="4.5" y2="23" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" />

              {/* Right resting arm (hides on hover when waving) */}
              <line x1="28" y1="17" x2="31.5" y2="23" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" className="group-hover:opacity-0 transition-opacity duration-150" />

              {/* Pill body */}
              <rect x="8" y="4" width="20" height="26" rx="10" fill="#141414" />

              {/* Rosy blushing cheeks (appear when waving) */}
              <circle cx="10.5" cy="19" r="1.8" fill="#FF8A80" className="opacity-0 group-hover:opacity-90 transition-opacity duration-200" />
              <circle cx="25.5" cy="19" r="1.8" fill="#FF8A80" className="opacity-0 group-hover:opacity-90 transition-opacity duration-200" />

              {/* White eyes */}
              <circle cx="14" cy="14" r="2.2" fill="#FFFFFF" />
              <circle cx="22" cy="14" r="2.2" fill="#FFFFFF" />
              <circle cx="14.6" cy="13.5" r="0.9" fill="#141414" />
              <circle cx="22.6" cy="13.5" r="0.9" fill="#141414" />

              {/* Cheerful curved mouth */}
              <path d="M 15.5 19.5 Q 18 22.5 20.5 19.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* The Hello Wave Arm (pops up and waves energetically on hover) */}
              <g className="opacity-0 group-hover:opacity-100 slate-waving-arm-active transition-opacity duration-150">
                <line x1="27" y1="17" x2="38" y2="7" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="38" cy="7" r="2.2" fill="#141414" />
              </g>
            </svg>
          </div>
        </div>
      </footer>

      {/* In-Browser Document Previewer Modal with History/Hash Integration (Issue 1) */}
      <FilePreviewModal
        file={previewFile}
        folderFiles={previewFilesList}
        onNavigate={(nextFile) => {
          setPreviewFile(nextFile);
          triggerToast(nextFile.name);
          updateUrl(activeCourse, activeFolderTrail, nextFile, true);
        }}
        onNavigateFile={handleNavigateFile}
        onNavigateFolder={handleNavigateFolder}
        onNavigateCourse={handleNavigateCourse}
        onClose={handleClosePreview}
        onDownload={handleDownload}
      />
    </div>
  );
}
