import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SharedPromptEditor from './components/SharedPromptEditor';
import VersionHistoryModal from './components/VersionHistoryModal';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';

const WorkspaceContent = () => {
  const { sendDraftPrompt, switchRole } = useSocket();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedMessageForVersions, setSelectedMessageForVersions] = useState(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [urlRoomId, setUrlRoomId] = useState('');

  // Check URL query parameters for room code e.g. ?room=xyz
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setUrlRoomId(roomParam);
    }
  }, []);

  const handleEditPrompt = (message) => {
    setEditingMessageId(message.messageId);
    sendDraftPrompt(message.prompt);
    if (message.role) switchRole(message.role);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  const handleOpenVersionModal = (msg = null) => {
    setSelectedMessageForVersions(msg);
    setIsVersionModalOpen(true);
  };

  const handleSelectVersion = (versionItem) => {
    if (versionItem.prompt) {
      sendDraftPrompt(versionItem.prompt);
    }
    if (versionItem.role) {
      switchRole(versionItem.role);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-900 overflow-hidden font-sans">
      {/* Header Bar */}
      <Header
        onOpenRoomModal={() => setIsOnboardingOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Main Workspace Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          onOpenRoomModal={() => setIsOnboardingOpen(true)}
          onOpenVersionModal={() => handleOpenVersionModal(null)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Chat & Shared Prompt Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-dark-900/60">
          <ChatArea
            onEditPrompt={handleEditPrompt}
            onViewVersions={handleOpenVersionModal}
          />

          <SharedPromptEditor
            editingMessageId={editingMessageId}
            onCancelEdit={handleCancelEdit}
          />
        </main>
      </div>

      {/* Onboarding Startup Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        defaultRoomId={urlRoomId}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Login & Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Version History Comparison Modal */}
      {isVersionModalOpen && (
        <VersionHistoryModal
          message={selectedMessageForVersions}
          onClose={() => setIsVersionModalOpen(false)}
          onSelectVersion={handleSelectVersion}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <WorkspaceContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
