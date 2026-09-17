import React from 'react';
import {
  Calendar,
  Mail,
  ShieldCheck,
  Lock,
  ExternalLink,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode2
} from 'lucide-react';
import { GoogleCalendarEvent, GoogleMailHighlight, UserSession } from '../types';

interface GoogleWorkspaceViewProps {
  userSession: UserSession;
  calendarEvents: GoogleCalendarEvent[];
  mailHighlights: GoogleMailHighlight[];
}

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  userSession,
  calendarEvents,
  mailHighlights
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Identity & Security Whitelist Card */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xl text-indigo-300">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Google OAuth 2.0 & OpenID Connect Whitelist Policy
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
                Only users present in the <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-indigo-300">Security:AllowedGoogleEmails</code> array in <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-indigo-300">appsettings.json</code> are granted admission via the ASP.NET Core 9 <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-indigo-300">EmailWhitelistHandler</code> middleware.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono">
            <div className="text-indigo-300 text-[10px] uppercase tracking-wider">Active Authenticated Session</div>
            <div className="font-bold text-white mt-0.5">{userSession.email}</div>
            <div className="text-emerald-400 text-[11px] flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Identity Verified & Whitelisted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Google Calendar API & Gmail API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Calendar Section */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Google Calendar API v3
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Scope: https://www.googleapis.com/auth/calendar.readonly
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {calendarEvents.length} Events Today
            </span>
          </div>

          <div className="space-y-3">
            {calendarEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {evt.summary}
                  </div>
                  {evt.conferenceLink && (
                    <a
                      href={evt.conferenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 shadow-xs"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join Meet</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>

                  {evt.location && (
                    <span>Location: {evt.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gmail Priority Highlights Section */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Gmail API v1 Priority Digest
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Scope: https://www.googleapis.com/auth/gmail.readonly
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
              3 Unread Primary
            </span>
          </div>

          <div className="space-y-3">
            {mailHighlights.map((mail) => (
              <div
                key={mail.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {mail.subject}
                  </div>
                  {mail.isUrgent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      High Priority
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-400 truncate">
                  From: {mail.from}
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                  {mail.snippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
