import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Card } from '@/components/ui/card';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (editorRef.current && !editor.current) {
      monaco.languages.register({ id: 'solidity' });
      monaco.languages.setMonarchTokensProvider('solidity', {
        keywords: [
          'contract', 'library', 'interface', 'function', 'constructor',
          'event', 'modifier', 'struct', 'enum', 'public', 'private',
          'internal', 'external', 'pure', 'view', 'payable', 'memory',
          'storage', 'calldata'
        ],
        operators: [
          '=', '>', '<', '!', '~', '?', ':',
          '==', '<=', '>=', '!=', '&&', '||', '++', '--',
          '+', '-', '*', '/', '&', '|', '^', '%', '<<',
          '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
          '^=', '%=', '<<=', '>>=', '>>>='
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
          root: [
            [/[a-zA-Z_]\w*/, { cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }}],
            [/[{}()\[\]]/, '@brackets'],
            [/@symbols/, 'operator'],
            [/\d+/, 'number'],
            [/".*?"/, 'string'],
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
          ],
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ]
        }
      });

      editor.current = monaco.editor.create(editorRef.current, {
        value,
        language: 'solidity',
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 16 },
      });

      editor.current.onDidChangeModelContent(() => {
        onChange(editor.current?.getValue() || '');
      });
    }

    return () => {
      editor.current?.dispose();
    };
  }, []);

  return (
    <Card className="w-full h-[500px] overflow-hidden">
      <div ref={editorRef} className="w-full h-full" />
    </Card>
  );
}
