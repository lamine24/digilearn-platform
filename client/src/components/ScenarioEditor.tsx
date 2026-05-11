/**
 * ScenarioEditor Component - WYSIWYG Editor for Scenario Content
 * Allows formators to edit and enrich scenario content with rich text formatting
 */

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioEditorProps {
  scenarioId: number;
  initialTitle: string;
  initialDescription: string;
  initialObjectives?: string;
  initialContent?: string;
  initialInteractive?: string;
  onSave: (data: ScenarioEditorData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ScenarioEditorData {
  title: string;
  description: string;
  learningObjectives?: string;
  contentStructure?: string;
  interactiveElements?: string;
}

/**
 * Toolbar Button Component
 */
const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded hover:bg-gray-200 transition-colors',
      isActive && 'bg-blue-200',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

/**
 * Editor Toolbar Component
 */
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={18} />
      </ToolbarButton>

      <div className="w-px bg-gray-300" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code size={18} />
      </ToolbarButton>

      <div className="w-px bg-gray-300" />

      <ToolbarButton onClick={addLink} title="Add Link">
        <LinkIcon size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addImage} title="Add Image">
        <ImageIcon size={18} />
      </ToolbarButton>

      <div className="w-px bg-gray-300" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={18} />
      </ToolbarButton>
    </div>
  );
};

/**
 * Rich Text Editor Component
 */
const RichTextEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (content: string) => void;
  placeholder: string;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
};

/**
 * Main ScenarioEditor Component
 */
export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  scenarioId,
  initialTitle,
  initialDescription,
  initialObjectives = '',
  initialContent = '',
  initialInteractive = '',
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [objectives, setObjectives] = useState(initialObjectives);
  const [content, setContent] = useState(initialContent);
  const [interactive, setInteractive] = useState(initialInteractive);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        title,
        description,
        learningObjectives: objectives,
        contentStructure: content,
        interactiveElements: interactive,
      });
    } finally {
      setIsSaving(false);
    }
  }, [title, description, objectives, content, interactive, onSave]);

  const handleReset = () => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setObjectives(initialObjectives);
    setContent(initialContent);
    setInteractive(initialInteractive);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Éditer le Scénario</CardTitle>
        <CardDescription>Enrichissez le scénario généré avec un contenu personnalisé</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="objectives">Objectifs</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="interactive">Interactif</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre du Scénario</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du scénario"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du scénario"
                rows={4}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* Objectives Tab */}
          <TabsContent value="objectives" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Objectifs d'Apprentissage</label>
              <RichTextEditor
                value={objectives}
                onChange={setObjectives}
                placeholder="Définissez les objectifs d'apprentissage..."
              />
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Structure du Contenu</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Décrivez la structure et le contenu du scénario..."
              />
            </div>
          </TabsContent>

          {/* Interactive Tab */}
          <TabsContent value="interactive" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Éléments Interactifs</label>
              <RichTextEditor
                value={interactive}
                onChange={setInteractive}
                placeholder="Décrivez les éléments interactifs du scénario..."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isLoading || isSaving}>
            <X size={18} className="mr-2" />
            Annuler
          </Button>

          <Button variant="outline" onClick={handleReset} disabled={isLoading || isSaving}>
            Réinitialiser
          </Button>

          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            <Save size={18} className="mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioEditor;
