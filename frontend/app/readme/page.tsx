import React from 'react';

export default function ReadmePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-700 mb-2 flex items-center gap-2">
          🛒 Einkaufslisten-App <span className="text-base font-medium text-gray-400">(DevOps Demo)</span>
        </h1>
        <p className="mb-4 text-gray-700">Eine moderne, produktionsreife Einkaufslisten-App mit FastAPI-Backend und Next.js-Frontend, vollständig automatisiert mit GitHub Actions, bereitgestellt auf AWS EKS mit Terraform und Helm.</p>
        
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">Wie es funktioniert</h2>
          <p className="text-gray-700 text-sm">Fügen Sie Artikel zu Ihrer Einkaufsliste hinzu mit Name, Menge, Kategorie und Emoji. Markieren Sie Artikel als erledigt oder löschen Sie sie. Verwenden Sie "Standard laden" um Beispielartikel zu laden. Alle Daten werden lokal im JSON-Format gespeichert.</p>
        </div>
        
        <ul className="mb-6 space-y-2">
          <li><b>Backend:</b> FastAPI (Python), persistente EBS-Speicherung, nur intern (ClusterIP)</li>
          <li><b>Frontend:</b> Next.js (React), öffentlich über AWS ALB, moderne UI, API-Proxy für sicheren Backend-Zugriff</li>
          <li><b>Infrastruktur:</b> AWS EKS, EBS, ALB, alles bereitgestellt mit <b>Terraform</b></li>
          <li><b>Deployment:</b> <b>Helm</b>-Charts für Frontend und Backend, Kubernetes-Setup nach Best Practices</li>
          <li><b>CI/CD:</b> <b>GitHub Actions</b> baut, taggt und deployed Docker-Images als <code>latest</code> und mit Commit-SHA</li>
          <li><b>Lokale Entwicklung:</b> <code>docker-compose</code> für nahtlose lokale Erfahrung, mit .env-Unterstützung</li>
        </ul>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Hauptfunktionen</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Moderne, responsive UI mit Next.js und Tailwind CSS</li>
            <li>Sicheres Backend (in Produktion nicht dem Internet ausgesetzt)</li>
            <li>Next.js API-Proxy für alle Backend-Kommunikation</li>
            <li>Ein-Befehl lokale Entwicklung und vollständig automatisierte Cloud-Bereitstellung</li>
            <li>Infrastructure as Code: wiederholbar, überprüfbar und robust</li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Lokal ausführen</h2>
          <pre className="bg-blue-50 rounded p-3 text-sm text-blue-900 overflow-x-auto mb-2">docker-compose up -d</pre>
          <p className="text-gray-600">Frontend: <b>http://localhost:3000</b> &nbsp;|&nbsp; Backend: <b>http://localhost:8000</b></p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Produktions-Highlights</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Terraform stellt alle AWS-Ressourcen bereit (EKS, VPC, IAM, ALB, EBS)</li>
            <li>Helm verwaltet Kubernetes-Deployments und -Upgrades</li>
            <li>GitHub Actions Pipeline: Build, Push und Deploy bei jedem Commit</li>
            <li>Frontend über ALB exponiert, Backend intern für Sicherheit</li>
          </ul>
        </div>
        <div className="text-center text-gray-400 text-xs mt-8">
          &copy; {new Date().getFullYear()} Einkaufslisten-App &mdash; DevOps Demo
        </div>
      </div>
    </div>
  );
} 