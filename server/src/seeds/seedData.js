const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const FileRecord = require('../models/FileRecord');

const seedDatabase = async (standalone = true) => {
  try {
    if (standalone) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      FileRecord.deleteMany({}),
    ]);

    console.log('[Seed] Creating Departments...');
    const departments = await Department.create([
      { name: 'Development', description: 'Software engineering, cloud infrastructure, and QA' },
      { name: 'Design', description: 'Product design, UI/UX, brand identity, and design systems' },
      { name: 'Marketing', description: 'Brand strategy, user acquisition, SEO, and content creation' },
      { name: 'Human Resources', description: 'Talent acquisition, onboarding, and people operations' },
      { name: 'Finance', description: 'Financial forecasting, budgeting, and accounting' },
      { name: 'Sales', description: 'Client partnerships, enterprise deals, and business development' },
    ]);

    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.name] = d._id;
    });

    console.log('[Seed] Creating Users (Admin, Managers, Employees)...');
    const defaultPassword = 'Password123!';

    const usersData = [
      {
        name: 'Abdul Lathif',
        email: 'abdul@company.com',
        password: defaultPassword,
        role: 'admin',
        position: 'Lead Architect & CTO',
        department: deptMap['Development'],
        phone: '+1 (555) 019-2831',
        skills: ['Full Stack Architecture', 'Node.js', 'React', 'Distributed Systems', 'Cloud Ops'],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Admin User',
        email: 'admin@company.com',
        password: defaultPassword,
        role: 'admin',
        position: 'Platform Administrator',
        department: deptMap['Development'],
        phone: '+1 (555) 019-2830',
        skills: ['Access Control', 'Audit Review', 'Compliance', 'Security'],
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      {
        name: 'Sarah Jenkins',
        email: 'manager.sarah@company.com',
        password: defaultPassword,
        role: 'manager',
        position: 'VP of Software Engineering',
        department: deptMap['Development'],
        phone: '+1 (555) 014-9923',
        skills: ['Agile / Scrum', 'Node.js', 'Microservices', 'Team Leadership'],
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'David Chen',
        email: 'manager.david@company.com',
        password: defaultPassword,
        role: 'manager',
        position: 'Director of Product',
        department: deptMap['Design'],
        phone: '+1 (555) 018-4412',
        skills: ['Product Roadmap', 'UX Research', 'Design Systems', 'Data Analytics'],
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.v@company.com',
        password: defaultPassword,
        role: 'employee',
        position: 'Senior Backend Engineer',
        department: deptMap['Development'],
        phone: '+1 (555) 012-7788',
        skills: ['Node.js', 'MongoDB', 'Redis', 'Docker', 'GraphQL'],
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.r@company.com',
        password: defaultPassword,
        role: 'employee',
        position: 'Lead UI/UX Designer',
        department: deptMap['Design'],
        phone: '+1 (555) 016-3399',
        skills: ['Figma', 'Prototyping', 'Design Systems', 'Tailwind CSS', 'Accessibility'],
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
      {
        name: 'Rajesh Sharma',
        email: 'rajesh.s@company.com',
        password: defaultPassword,
        role: 'employee',
        position: 'DevOps & Cloud Specialist',
        department: deptMap['Development'],
        phone: '+1 (555) 017-5566',
        skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      },
      {
        name: 'Amina Morales',
        email: 'amina.m@company.com',
        password: defaultPassword,
        role: 'employee',
        position: 'Growth Marketing Manager',
        department: deptMap['Marketing'],
        phone: '+1 (555) 013-4477',
        skills: ['Growth Hacking', 'Google Ads', 'Content Strategy', 'HubSpot'],
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      },
      {
        name: 'Liam O\'Connor',
        email: 'liam.o@company.com',
        password: defaultPassword,
        role: 'employee',
        position: 'QA Automation Engineer',
        department: deptMap['Development'],
        phone: '+1 (555) 015-8822',
        skills: ['Cypress', 'Jest', 'Playwright', 'API Automation', 'Load Testing'],
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    ];

    const createdUsers = await User.create(usersData);
    const userMap = {};
    createdUsers.forEach((u) => {
      userMap[u.email] = u;
    });

    // Update department managers
    await Department.findByIdAndUpdate(deptMap['Development'], { manager: userMap['manager.sarah@company.com']._id });
    await Department.findByIdAndUpdate(deptMap['Design'], { manager: userMap['manager.david@company.com']._id });

    console.log('[Seed] Creating Projects...');
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

    const projectsData = [
      {
        name: 'Enterprise Cloud Migration',
        description: 'Migrating legacy monolith infrastructure to containerized microservices on AWS with high availability.',
        client: 'OmniCorp Global',
        startDate: addDays(now, -30),
        endDate: addDays(now, 45),
        status: 'active',
        priority: 'critical',
        manager: userMap['manager.sarah@company.com']._id,
        members: [
          userMap['marcus.v@company.com']._id,
          userMap['rajesh.s@company.com']._id,
          userMap['liam.o@company.com']._id,
        ],
        budget: 120000,
        technologies: ['AWS', 'Docker', 'Kubernetes', 'Node.js', 'Terraform'],
      },
      {
        name: 'NextGen Mobile App Redesign',
        description: 'Complete overhaul of the customer mobile interface with modern design tokens, sleek animations, and biometric auth.',
        client: 'FinTech Pulse',
        startDate: addDays(now, -15),
        endDate: addDays(now, 60),
        status: 'active',
        priority: 'high',
        manager: userMap['manager.david@company.com']._id,
        members: [
          userMap['elena.r@company.com']._id,
          userMap['marcus.v@company.com']._id,
          userMap['liam.o@company.com']._id,
        ],
        budget: 85000,
        technologies: ['React Native', 'Figma', 'TypeScript', 'Tailwind', 'GraphQL'],
      },
      {
        name: 'AI Workflow Automation Suite',
        description: 'Integrating LLM agents into internal support pipelines to automatically summarize tickets and route incidents.',
        client: 'SphereOps Internal',
        startDate: addDays(now, -5),
        endDate: addDays(now, 90),
        status: 'planning',
        priority: 'medium',
        manager: userMap['manager.sarah@company.com']._id,
        members: [
          userMap['marcus.v@company.com']._id,
          userMap['elena.r@company.com']._id,
        ],
        budget: 45000,
        technologies: ['Python', 'LangChain', 'Node.js', 'FastAPI', 'Vector DB'],
      },
      {
        name: 'Global Customer Portal Revamp',
        description: 'Replatforming client facing dashboard into responsive SPA with multi-tenant permissions and billing history.',
        client: 'AeroDynamics LLC',
        startDate: addDays(now, -90),
        endDate: addDays(now, -5),
        status: 'completed',
        priority: 'high',
        manager: userMap['manager.david@company.com']._id,
        members: [
          userMap['elena.r@company.com']._id,
          userMap['marcus.v@company.com']._id,
          userMap['amina.m@company.com']._id,
        ],
        budget: 95000,
        technologies: ['React', 'Tailwind CSS', 'Stripe', 'Node.js'],
      },
    ];

    const createdProjects = await Project.create(projectsData);
    const pCloud = createdProjects[0];
    const pMobile = createdProjects[1];
    const pAI = createdProjects[2];
    const pPortal = createdProjects[3];

    console.log('[Seed] Creating Tasks across Kanban columns...');
    const tasksData = [
      // Cloud Migration Tasks
      {
        title: 'Provision EKS Cluster on AWS',
        description: 'Configure production Terraform scripts for multi-zone Kubernetes cluster with auto-scaling node groups.',
        project: pCloud._id,
        assignedTo: userMap['rajesh.s@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'critical',
        status: 'in_progress',
        dueDate: addDays(now, 3),
        tags: ['DevOps', 'AWS', 'Terraform'],
        order: 0,
      },
      {
        title: 'Database Sharding & Read Replica Setup',
        description: 'Deploy MongoDB Atlas replica sets with automated failover and regional read replicas.',
        project: pCloud._id,
        assignedTo: userMap['marcus.v@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'high',
        status: 'todo',
        dueDate: addDays(now, 7),
        tags: ['Database', 'MongoDB', 'Performance'],
        order: 0,
      },
      {
        title: 'End-to-End Stress & Chaos Testing',
        description: 'Simulate high load spikes (10k req/sec) and failover testing across cluster pods.',
        project: pCloud._id,
        assignedTo: userMap['liam.o@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'high',
        status: 'todo',
        dueDate: addDays(now, 12),
        tags: ['QA', 'Stress Testing'],
        order: 1,
      },
      {
        title: 'Architecture Blueprint & Security Review',
        description: 'Complete SOC2 compliance architecture audit with external security auditor.',
        project: pCloud._id,
        assignedTo: userMap['rajesh.s@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'critical',
        status: 'completed',
        dueDate: addDays(now, -10),
        tags: ['Security', 'Compliance'],
        order: 0,
      },
      {
        title: 'Dockerize Legacy Authentication Service',
        description: 'Create multi-stage Dockerfile and test container startup in staging environment.',
        project: pCloud._id,
        assignedTo: userMap['marcus.v@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'medium',
        status: 'review',
        dueDate: addDays(now, 2),
        tags: ['Docker', 'Backend'],
        order: 0,
      },

      // Mobile Redesign Tasks
      {
        title: 'Finalize Dark & Light Design Tokens in Figma',
        description: 'Define semantic color variables, typography hierarchy, and spacing scale for mobile views.',
        project: pMobile._id,
        assignedTo: userMap['elena.r@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'high',
        status: 'completed',
        dueDate: addDays(now, -5),
        tags: ['UI/UX', 'Figma'],
        order: 0,
      },
      {
        title: 'Implement Biometric Authentication Flow',
        description: 'Integrate FaceID and Fingerprint authentication with JWT keychain storage.',
        project: pMobile._id,
        assignedTo: userMap['marcus.v@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'high',
        status: 'in_progress',
        dueDate: addDays(now, 4),
        tags: ['Mobile', 'Security'],
        order: 0,
      },
      {
        title: 'Transaction History Screen & Filters',
        description: 'Build infinite scroll transaction list with date range and category filters.',
        project: pMobile._id,
        assignedTo: userMap['elena.r@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'medium',
        status: 'review',
        dueDate: addDays(now, 1),
        tags: ['Frontend', 'React Native'],
        order: 0,
      },
      {
        title: 'User Testing with Beta Cohort',
        description: 'Conduct 10 moderated usability interviews with target customers.',
        project: pMobile._id,
        assignedTo: userMap['elena.r@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'medium',
        status: 'todo',
        dueDate: addDays(now, 10),
        tags: ['UX Research'],
        order: 0,
      },

      // AI Suite Tasks
      {
        title: 'Benchmark LLM Embedding Models',
        description: 'Evaluate OpenAI text-embedding-3 vs open-source alternatives for retrieval accuracy.',
        project: pAI._id,
        assignedTo: userMap['marcus.v@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: addDays(now, 5),
        tags: ['AI', 'Embeddings'],
        order: 0,
      },
      {
        title: 'Prompt Engineering & Guardrail Policy',
        description: 'Formulate system prompts to prevent hallucination and enforce markdown output formats.',
        project: pAI._id,
        assignedTo: userMap['elena.r@company.com']._id,
        createdBy: userMap['manager.sarah@company.com']._id,
        priority: 'low',
        status: 'todo',
        dueDate: addDays(now, 14),
        tags: ['AI', 'Prompts'],
        order: 0,
      },

      // Completed Portal Tasks
      {
        title: 'Stripe Billing & Subscription Webhooks',
        description: 'Handle recurring subscription invoices and invoice.payment_failed events.',
        project: pPortal._id,
        assignedTo: userMap['marcus.v@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'critical',
        status: 'completed',
        dueDate: addDays(now, -20),
        tags: ['Billing', 'Stripe'],
        order: 0,
      },
      {
        title: 'Export Audit Logs to CSV / PDF',
        description: 'Enable organization admins to export activity records for regulatory compliance.',
        project: pPortal._id,
        assignedTo: userMap['liam.o@company.com']._id,
        createdBy: userMap['manager.david@company.com']._id,
        priority: 'medium',
        status: 'completed',
        dueDate: addDays(now, -15),
        tags: ['Reporting', 'Export'],
        order: 1,
      },
    ];

    const createdTasks = await Task.create(tasksData);

    console.log('[Seed] Adding Comments...');
    await Comment.create([
      {
        targetType: 'task',
        targetId: createdTasks[0]._id, // Provision EKS
        author: userMap['manager.sarah@company.com']._id,
        content: 'Please make sure we tag all resources with CostCenter and Environment=Production.',
      },
      {
        targetType: 'task',
        targetId: createdTasks[0]._id,
        author: userMap['rajesh.s@company.com']._id,
        content: 'Understood! I added automated AWS resource tags in the terraform module.',
      },
      {
        targetType: 'project',
        targetId: pCloud._id,
        author: userMap['admin@company.com']._id,
        content: 'Great velocity team. OmniCorp stakeholders were impressed with the sprint 1 demo.',
      },
    ]);

    console.log('[Seed] Creating Messages (Direct & Project Chats)...');
    await Message.create([
      {
        conversationType: 'direct',
        sender: userMap['manager.sarah@company.com']._id,
        recipient: userMap['marcus.v@company.com']._id,
        content: 'Hey Marcus, how is the database read replica benchmark looking?',
        readBy: [userMap['manager.sarah@company.com']._id, userMap['marcus.v@company.com']._id],
      },
      {
        conversationType: 'direct',
        sender: userMap['marcus.v@company.com']._id,
        recipient: userMap['manager.sarah@company.com']._id,
        content: 'Latency dropped by 65%! I will have the final pull request ready for review this afternoon.',
        readBy: [userMap['manager.sarah@company.com']._id, userMap['marcus.v@company.com']._id],
      },
      {
        conversationType: 'project',
        sender: userMap['elena.r@company.com']._id,
        project: pMobile._id,
        content: 'The Figma prototype for the biometric flow is published in the design channel!',
        readBy: [userMap['elena.r@company.com']._id],
      },
    ]);

    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        recipient: userMap['marcus.v@company.com']._id,
        sender: userMap['manager.sarah@company.com']._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'Sarah Jenkins assigned you task "Database Sharding & Read Replica Setup"',
        link: `/projects/${pCloud._id}?tab=tasks`,
        isRead: false,
      },
      {
        recipient: userMap['rajesh.s@company.com']._id,
        sender: userMap['manager.sarah@company.com']._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'Sarah Jenkins assigned you task "Provision EKS Cluster on AWS"',
        link: `/projects/${pCloud._id}?tab=tasks`,
        isRead: true,
      },
      {
        recipient: userMap['elena.r@company.com']._id,
        sender: userMap['manager.david@company.com']._id,
        type: 'project_added',
        title: 'Added to Project',
        message: 'You have been added to "NextGen Mobile App Redesign"',
        link: `/projects/${pMobile._id}`,
        isRead: false,
      },
    ]);

    console.log('[Seed] Creating Activity Logs...');
    await ActivityLog.create([
      {
        actor: userMap['admin@company.com']._id,
        action: 'PROJECT_CREATED',
        entityType: 'project',
        entityId: pCloud._id,
        entityName: pCloud.name,
        description: 'Alexander Wright created project "Enterprise Cloud Migration"',
      },
      {
        actor: userMap['manager.sarah@company.com']._id,
        action: 'TASK_CREATED',
        entityType: 'task',
        entityId: createdTasks[0]._id,
        entityName: createdTasks[0].title,
        description: 'Sarah Jenkins assigned "Provision EKS Cluster on AWS" to Rajesh Sharma',
      },
      {
        actor: userMap['rajesh.s@company.com']._id,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'task',
        entityId: createdTasks[0]._id,
        entityName: createdTasks[0].title,
        description: 'Rajesh Sharma moved "Provision EKS Cluster on AWS" from Todo to In Progress',
      },
      {
        actor: userMap['marcus.v@company.com']._id,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'task',
        entityId: createdTasks[4]._id,
        entityName: createdTasks[4].title,
        description: 'Marcus Vance moved "Dockerize Legacy Authentication Service" from In Progress to Review',
      },
    ]);

    console.log('\n======================================================');
    console.log('  Demo Database Seeded Successfully!');
    console.log('======================================================');
    console.log('  Admin:     admin@company.com          / Password123!');
    console.log('  Manager:   manager.sarah@company.com  / Password123!');
    console.log('  Manager:   manager.david@company.com  / Password123!');
    console.log('  Employee:  marcus.v@company.com       / Password123!');
    console.log('  Employee:  elena.r@company.com        / Password123!');
    console.log('======================================================\n');

    if (standalone) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
    if (standalone) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
