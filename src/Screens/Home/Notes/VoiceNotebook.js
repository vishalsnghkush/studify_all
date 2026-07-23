import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Button,
  TextInput,
  useTheme,
  FAB,
  Portal,
  Dialog,
  RadioButton,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView} from 'react-native-webview';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  requestMicrophonePermission,
  requestImagePermissions,
} from '../../../Utils/Permission';
import {
  trackEngagement,
  setRecentNote,
  logStudySession,
} from '../../../Utils/EngagementTracker';

const {width, height} = Dimensions.get('window');

// Available notebook cover colors (Premium leather/fabric colors)
const COVER_COLORS = [
  {name: 'Emerald', hex: '#0D5C3A'},
  {name: 'Royal Blue', hex: '#1A365D'},
  {name: 'Crimson', hex: '#7C1A22'},
  {name: 'Teal', hex: '#005F5F'},
  {name: 'Charcoal', hex: '#262626'},
  {name: 'Amber Brown', hex: '#874C14'},
];

// Page styles (ruled, grid, plain)
const PAGE_STYLES = [
  {label: 'Ruled Lines', value: 'ruled', icon: 'format-align-justify'},
  {label: 'Grid Squares', value: 'grid', icon: 'grid'},
  {label: 'Plain Canvas', value: 'plain', icon: 'square-outline'},
];

// Page background colors
const PAGE_COLORS = [
  {name: 'Cream / Legal', hex: '#FDF5E6'},
  {name: 'Soft Blue', hex: '#EBF5FB'},
  {name: 'Soft Green', hex: '#E8F8F5'},
  {name: 'Soft Pink', hex: '#FDEDEC'},
  {name: 'Classic White', hex: '#FFFFFF'},
  {name: 'Writer Dark', hex: '#1E1E1E'},
];

export default function VoiceNotebook({navigation}) {
  const {colors} = useTheme();

  // State Management
  const [notebooks, setNotebooks] = useState([]);
  const [currentNotebook, setCurrentNotebook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [viewState, setViewState] = useState('notebooks'); // 'notebooks' | 'pages' | 'editor'

  // Modals & Dialogs
  const [notebookDialogVisible, setNotebookDialogVisible] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState(COVER_COLORS[0]);
  const [newNotebookStyle, setNewNotebookStyle] = useState('ruled');
  const [newNotebookPageColor, setNewNotebookPageColor] = useState(
    PAGE_COLORS[0],
  );
  const [pageDialogVisible, setPageDialogVisible] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  const webViewRef = useRef(null);

  useEffect(() => {
    if (viewState === 'editor') {
      const startTime = Date.now();
      return () => {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        if (durationSeconds >= 2) {
          logStudySession(
            'General',
            currentPage?.title || 'Notebook Page',
            'Voice Note',
            durationSeconds,
          );
        }
      };
    }
  }, [viewState, currentPage]);

  // Initialize and load saved notebooks
  useEffect(() => {
    loadNotebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotebooks = async () => {
    try {
      const savedNotebooks = await AsyncStorage.getItem('@voice_notebooks');
      if (savedNotebooks) {
        setNotebooks(JSON.parse(savedNotebooks));
      } else {
        await createDefaultUserManual();
      }
    } catch (e) {
      console.error('Failed to load notebooks', e);
    }
  };

  const createDefaultUserManual = async () => {
    const defaultNotebooks = [
      {
        id: 'manual_notebook',
        title: '📖 User Manual & Guide',
        color: '#005F5F',
        pageStyle: 'ruled',
        pageColor: '#FDF5E6',
        createdAt: new Date().toISOString(),
      },
    ];

    const defaultPages = [
      {
        id: 'manual_page_1',
        notebookId: 'manual_notebook',
        title: '🎙️ Voice Typing & Paragraphs',
        content: `
          <div class="page-sheet" id="page-1">
            <h2 style="color: #005F5F; margin-top: 0;">Welcome to Voice Notebook!</h2>
            <p>This is your personal diary and smart notes app that supports typing, sketching, and rich voice commands.</p>
            <p>Paragraphs & Bullet Points:</p>
            <p>While using voice typing, you can control the structure of your notes using natural spoken commands:</p>
            <ul>
              <li>To start a new paragraph, simply say: <strong>"next paragraph"</strong> or <strong>"new paragraph"</strong>.</li>
              <li>To create points, say: <strong>"bullet point"</strong> or <strong>"new point"</strong>.</li>
            </ul>
            <p>Try clicking the mic button in the editor and say: <em>"Hello world, next paragraph, this is my new diary entry."</em></p>
          </div>
        `,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'manual_page_2',
        notebookId: 'manual_notebook',
        title: '🎨 Drawing Biology Diagrams',
        content: `
          <div class="page-sheet" id="page-1">
            <h2 style="color: #874C14; margin-top: 0;">How to Draw & Insert Diagrams</h2>
            <p>If you are taking biology, physics, or geometry notes, drawing visual diagrams is extremely simple:</p>
            <p>1. Tap the **"Brush/Drawing"** icon in the editor toolbar.</p>
            <p>2. Choose your color and brush size in the drawing pad modal.</p>
            <p>3. Draw your diagram or sketch.</p>
            <p>4. Tap **"Insert Sketch"**. The diagram will instantly insert as an inline image right where your cursor is!</p>
          </div>
        `,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    try {
      await AsyncStorage.setItem(
        '@voice_notebooks',
        JSON.stringify(defaultNotebooks),
      );
      await AsyncStorage.setItem(
        '@voice_notebook_pages_manual_notebook',
        JSON.stringify(defaultPages),
      );
      setNotebooks(defaultNotebooks);
    } catch (e) {
      console.error('Failed to create default user manual', e);
    }
  };

  const loadPages = async notebookId => {
    try {
      const savedPages = await AsyncStorage.getItem(
        `@voice_notebook_pages_${notebookId}`,
      );
      if (savedPages) {
        setPages(JSON.parse(savedPages));
      } else {
        setPages([]);
      }
    } catch (e) {
      console.error('Failed to load pages', e);
    }
  };

  const handleSelectNotebook = notebook => {
    setCurrentNotebook(notebook);
    loadPages(notebook.id);
    setViewState('pages');
    trackEngagement('General', 'note');
    setRecentNote({
      name: `Notebook: ${notebook.title}`,
      subject: 'General',
      type: 'note',
      board: '',
      class: '',
      subtopic: '',
    });
  };

  const handleSelectPage = async page => {
    await requestMicrophonePermission();
    setCurrentPage(page);
    setViewState('editor');
    trackEngagement('General', 'note');
    setRecentNote({
      name: `Page: ${page.title}`,
      subject: 'General',
      type: 'note',
      board: '',
      class: '',
      subtopic: '',
    });
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) {
      Alert.alert('Required', 'Please enter a notebook name.');
      return;
    }

    const newNotebook = {
      id: `nb_${Date.now()}`,
      title: newNotebookTitle,
      color: newNotebookColor.hex,
      pageStyle: newNotebookStyle,
      pageColor: newNotebookPageColor.hex,
      createdAt: new Date().toISOString(),
    };

    const updatedNotebooks = [...notebooks, newNotebook];
    try {
      await AsyncStorage.setItem(
        '@voice_notebooks',
        JSON.stringify(updatedNotebooks),
      );
      setNotebooks(updatedNotebooks);
      setNewNotebookTitle('');
      setNotebookDialogVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create notebook');
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) {
      Alert.alert('Required', 'Please enter a page title.');
      return;
    }

    const newPage = {
      id: `pg_${Date.now()}`,
      notebookId: currentNotebook.id,
      title: newPageTitle,
      content: `
        <div class="page-sheet" id="page-1" contenteditable="true" oninput="saveContent()" placeholder="Start writing here... Tap the microphone to start voice typing or use the keyboard."></div>
      `,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPages = [...pages, newPage];
    try {
      await AsyncStorage.setItem(
        `@voice_notebook_pages_${currentNotebook.id}`,
        JSON.stringify(updatedPages),
      );
      setPages(updatedPages);
      setCurrentPage(newPage);
      setNewPageTitle('');
      setPageDialogVisible(false);
      setViewState('editor');
    } catch (e) {
      Alert.alert('Error', 'Failed to create page');
    }
  };

  const handleSavePage = async htmlContent => {
    if (!currentPage || currentNotebook.id === 'manual_notebook') {
      return;
    }

    const updatedPages = pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          content: htmlContent,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    try {
      await AsyncStorage.setItem(
        `@voice_notebook_pages_${currentNotebook.id}`,
        JSON.stringify(updatedPages),
      );
      setPages(updatedPages);
    } catch (e) {
      console.error('Failed to auto-save page', e);
    }
  };

  const handleDeleteNotebook = notebookId => {
    Alert.alert(
      'Delete Notebook',
      'Are you sure you want to delete this notebook and all its pages?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotebooks = notebooks.filter(n => n.id !== notebookId);
            try {
              await AsyncStorage.setItem(
                '@voice_notebooks',
                JSON.stringify(updatedNotebooks),
              );
              await AsyncStorage.removeItem(
                `@voice_notebook_pages_${notebookId}`,
              );
              setNotebooks(updatedNotebooks);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete notebook');
            }
          },
        },
      ],
    );
  };

  const handleDeletePage = pageId => {
    Alert.alert('Delete Page', 'Are you sure you want to delete this page?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedPages = pages.filter(p => p.id !== pageId);
          try {
            await AsyncStorage.setItem(
              `@voice_notebook_pages_${currentNotebook.id}`,
              JSON.stringify(updatedPages),
            );
            setPages(updatedPages);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete page');
          }
        },
      },
    ]);
  };

  // Image insertion bridge
  const handlePickImage = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const base64Data = `data:${asset.type};base64,${asset.base64}`;
      const script = `insertImage("${base64Data}");`;
      webViewRef.current?.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SAVE') {
        handleSavePage(data.html);
      } else if (data.type === 'PICK_IMAGE') {
        handlePickImage();
      } else if (data.type === 'REQUEST_MIC_PERMISSION') {
        requestMicrophonePermission();
      } else if (data.type === 'SPEECH_ERROR') {
        Alert.alert(
          'Speech Recognition Info',
          `The speech engine reported: "${data.error}". If speech typing is not writing anything on the emulator, you can use the keyboard spacebar's microphone icon, which works natively!`,
        );
      } else if (data.type === 'AI_SUMMARIZE') {
        handleAISummarize(data.content);
      }
    } catch (e) {
      console.warn('WebView Message Error:', e);
    }
  };

  const handleAISummarize = async htmlContent => {
    const cleanText = (htmlContent || '').replace(/<[^>]+>/g, ' ').trim();
    if (!cleanText || cleanText.length < 5) {
      Alert.alert(
        'Note Empty',
        'Please write or record some notes first before summarizing!',
      );
      return;
    }

    try {
      const prompt = `Summarize the following notes into a clean, concise summary with key takeaways and bullet points. Return only plain text:\n\n${cleanText}`;

      const models = [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-lite-001',
        'qwen/qwen-2.5-coder-32b-instruct:free',
      ];

      let response = null;
      let data = null;

      for (const modelName of models) {
        try {
          const res = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                Authorization:
                  'Bearer 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',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{role: 'user', content: prompt}],
              }),
            },
          );
          if (res.ok) {
            data = await res.json();
            if (data?.choices?.[0]?.message?.content) {
              response = data;
              break;
            }
          }
        } catch (err) {
          console.log(`Failed with model ${modelName}, trying next...`, err);
        }
      }

      if (
        !data ||
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message
      ) {
        throw new Error('All OpenRouter models failed to respond.');
      }

      let summary = data.choices[0].message.content.trim();

      // Inject it back into the WebView
      const injectHtml = `<div style="background: rgba(156, 39, 176, 0.15); padding:15px; border-radius:8px; border-left: 4px solid #9C27B0; margin-top:20px;">
        <h3 style="color:#9C27B0; margin-top:0;">✨ AI Summary</h3>
        <p style="color: inherit; line-height: 1.5;">${summary.replace(
          /\n/g,
          '<br>',
        )}</p>
      </div><br>`;

      const script = `
        const editor = document.getElementById('editor-container');
        editor.innerHTML += \`${injectHtml}\`;
        saveContent();
      `;
      webViewRef.current?.injectJavaScript(script);
      Alert.alert('Success', 'AI Summary added to your notes!');
    } catch (e) {
      console.log('Error summarizing notes:', e);
      Alert.alert(
        'Error',
        'Failed to summarize notes. Please check your internet connection and try again.',
      );
    }
  };

  // Render Notebooks List Screen
  const renderNotebooks = () => (
    <View style={styles.container}>
      <Card style={[styles.headerCard, {backgroundColor: colors.primary}]}>
        <Card.Content style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Voice Notebooks</Text>
            <Text style={styles.headerSubtitle}>
              Speech-to-text notes and diaries
            </Text>
          </View>
          <IconButton
            icon="book-open-page-variant"
            iconColor="#fff"
            size={32}
          />
        </Card.Content>
      </Card>

      <FlatList
        data={notebooks}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listPadding}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.notebookCardContainer}
            onPress={() => handleSelectNotebook(item)}
            onLongPress={() =>
              item.id !== 'manual_notebook' && handleDeleteNotebook(item.id)
            }>
            {/* Custom Book Cover Style */}
            <View style={[styles.bookCover, {backgroundColor: item.color}]}>
              {/* Left spine/binding fold */}
              <View style={styles.bookSpine} />
              <View style={styles.bookSpineLine} />

              {/* Golden Embossed Title Card */}
              <View style={styles.bookTitleCard}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.bookDivider} />
                <Text style={styles.bookMeta}>
                  {(item.pageStyle || 'ruled').toUpperCase()}
                </Text>
              </View>

              {/* Bookmark Ribbon */}
              <View style={styles.bookRibbon} />
            </View>
          </TouchableOpacity>
        )}
      />

      <FAB
        icon="folder-plus"
        style={[styles.fab, {backgroundColor: colors.primary}]}
        color="#fff"
        onPress={() => setNotebookDialogVisible(true)}
      />

      {/* Create Notebook Dialog */}
      <Portal>
        <Dialog
          visible={notebookDialogVisible}
          onDismiss={() => setNotebookDialogVisible(false)}
          style={[
            styles.customDialog,
            {backgroundColor: colors.elevation.level3},
          ]}>
          <Dialog.Title>Create New Notebook</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Notebook Name"
                value={newNotebookTitle}
                onChangeText={setNewNotebookTitle}
                mode="outlined"
                style={styles.dialogInput}
              />

              <Text
                style={[styles.dialogSectionHeader, {color: colors.onSurface}]}>
                Notebook Cover Color:
              </Text>
              <View style={styles.colorPalette}>
                {COVER_COLORS.map(c => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorOption,
                      {backgroundColor: c.hex},
                      newNotebookColor.hex === c.hex &&
                        styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewNotebookColor(c)}
                  />
                ))}
              </View>

              <Text
                style={[styles.dialogSectionHeader, {color: colors.onSurface}]}>
                Page Style:
              </Text>
              <RadioButton.Group
                onValueChange={value => setNewNotebookStyle(value)}
                value={newNotebookStyle}>
                {PAGE_STYLES.map(style => (
                  <View key={style.value} style={styles.radioOption}>
                    <RadioButton
                      value={style.value}
                      color={newNotebookColor.hex}
                    />
                    <IconButton
                      icon={style.icon}
                      size={20}
                      style={{margin: 0}}
                    />
                    <Text style={{color: colors.onSurface, marginLeft: 8}}>
                      {style.label}
                    </Text>
                  </View>
                ))}
              </RadioButton.Group>

              <Text
                style={[styles.dialogSectionHeader, {color: colors.onSurface}]}>
                Page Color:
              </Text>
              <View style={styles.colorPalette}>
                {PAGE_COLORS.map(c => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.pageColorOption,
                      {backgroundColor: c.hex},
                      newNotebookPageColor.hex === c.hex &&
                        styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewNotebookPageColor(c)}
                  />
                ))}
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNotebookDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleCreateNotebook}>Create Book</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );

  // Render Pages List Screen
  const renderPages = () => (
    <View style={styles.container}>
      <Card
        style={[styles.headerCard, {backgroundColor: currentNotebook.color}]}>
        <Card.Content style={styles.headerContent}>
          <IconButton
            icon="keyboard-backspace"
            iconColor="#fff"
            size={28}
            onPress={() => setViewState('notebooks')}
          />
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>{currentNotebook.title}</Text>
            <Text style={styles.headerSubtitle}>
              Pages • Style:{' '}
              {(currentNotebook.pageStyle || 'ruled').toUpperCase()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {pages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="book-open-outline"
            size={64}
            iconColor={colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyText, {color: colors.onSurfaceVariant}]}>
            This notebook has no pages yet.
          </Text>
          <Button
            mode="contained"
            style={{marginTop: 12, backgroundColor: currentNotebook.color}}
            onPress={() => setPageDialogVisible(true)}>
            Add Page
          </Button>
        </View>
      ) : (
        <FlatList
          data={pages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({item}) => (
            <Card
              style={[
                styles.pageCard,
                {backgroundColor: colors.elevation.level2},
              ]}
              onPress={() => handleSelectPage(item)}
              onLongPress={() =>
                item.id.indexOf('manual_page') === -1 &&
                handleDeletePage(item.id)
              }>
              <Card.Content style={styles.pageCardContent}>
                {/* Visual miniature representation of the notebook style on list card */}
                <View
                  style={[
                    styles.pageIndicator,
                    {
                      backgroundColor: currentNotebook.pageColor,
                      borderLeftWidth: 4,
                      borderLeftColor: currentNotebook.color,
                    },
                  ]}>
                  {currentNotebook.pageStyle === 'ruled' && (
                    <View style={styles.miniRuledLines} />
                  )}
                  {currentNotebook.pageStyle === 'grid' && (
                    <View style={styles.miniGridLines} />
                  )}
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={[styles.pageTitle, {color: colors.onSurface}]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.pageDate, {color: colors.onSurfaceVariant}]}>
                    Last Edited: {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <IconButton
                  icon={
                    currentNotebook.id === 'manual_notebook'
                      ? 'eye'
                      : 'pencil-outline'
                  }
                  iconColor={currentNotebook.color}
                  size={22}
                />
              </Card.Content>
            </Card>
          )}
        />
      )}

      {currentNotebook.id !== 'manual_notebook' && (
        <FAB
          icon="note-plus"
          style={[styles.fab, {backgroundColor: currentNotebook.color}]}
          color="#fff"
          onPress={() => setPageDialogVisible(true)}
        />
      )}

      {/* Create Page Dialog */}
      <Portal>
        <Dialog
          visible={pageDialogVisible}
          onDismiss={() => setPageDialogVisible(false)}>
          <Dialog.Title>Add Page to Notebook</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Page Title"
              value={newPageTitle}
              onChangeText={setNewPageTitle}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPageDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreatePage}>Create Page</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );

  // Render WebView Rich-Text / Canvas Editor Screen
  const renderEditor = () => {
    const pageColor = currentNotebook.pageColor || '#FFFFFF';
    const pageStyle = currentNotebook.pageStyle || 'plain';
    const isReadOnly = currentNotebook.id === 'manual_notebook';
    const isDarkPage = pageColor === '#1E1E1E';

    const lineColor = isDarkPage
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.07)';
    const marginColor = isDarkPage
      ? 'rgba(255, 100, 100, 0.3)'
      : 'rgba(255, 100, 100, 0.4)';
    const textColor = isDarkPage ? '#E0E0E0' : '#1C1C1C';
    const headingColor = isDarkPage ? '#FFF' : '#000';

    // Rich editor HTML template with notebook line styling & read-only toggle
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <title>Editor</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: #E0E0E0;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          #toolbar {
            background-color: #1E1E1E;
            padding: 10px;
            display: ${isReadOnly ? 'none' : 'flex'};
            gap: 8px;
            flex-wrap: wrap;
            border-bottom: 1px solid #333;
            align-items: center;
          }
          .tool-btn {
            background: #2D2D2D;
            border: 1px solid #444;
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            box-sizing: border-box;
          }
          .tool-btn:active {
            background: #444;
          }
          .tool-btn.active {
            background: #008080;
            border-color: #00B3B3;
          }
          
          /* Color Palette Toolbar buttons */
          .color-palette {
            display: flex;
            gap: 6px;
            align-items: center;
            margin-right: 8px;
          }
          .color-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #555;
            cursor: pointer;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
          }
          .color-btn.active {
            border-color: #fff;
            transform: scale(1.15);
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          }

          #editor-container {
            flex: 1;
            overflow-y: auto;
            position: relative;
            background-color: #2F2F2F; /* Dark desk background for page sheets */
            padding: 20px 10px;
          }
          
          /* Stacked Paper Sheets representing multiple pages */
          #pages-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
            width: 100%;
            box-sizing: border-box;
          }
          .page-sheet {
            width: 100%;
            max-width: 800px;
            min-height: 840px; /* A4 aspect ratio look */
            background-color: ${pageColor};
            color: ${textColor};
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            padding: 30px 30px 40px 30px;
            box-sizing: border-box;
            outline: none;
            position: relative;

            /* Ruled Paper Style background */
            ${
              pageStyle === 'ruled'
                ? `
              background-image: linear-gradient(${lineColor} 1px, transparent 1px);
              background-size: 100% 30px;
              background-position: 0 7px;
              background-attachment: local;
            `
                : ''
            }

            /* Grid Paper Style background */
            ${
              pageStyle === 'grid'
                ? `
              background-image: linear-gradient(${lineColor} 1px, transparent 1px),
                                linear-gradient(90deg, ${lineColor} 1px, transparent 1px);
              background-size: 30px 30px;
              background-position: 0 7px;
              background-attachment: local;
            `
                : ''
            }
          }

          .page-sheet:empty:after {
            content: attr(placeholder);
            color: #888888;
            opacity: 0.6;
            font-size: 16px;
            font-weight: normal;
            line-height: 30px;
            display: block;
            pointer-events: none;
          }

          /* Highlight selected image */
          img.selected-image {
            outline: 2px dashed #00B3B3;
            box-shadow: 0 0 10px rgba(0, 179, 179, 0.5);
          }

          /* Left margin line for ruled paper */
          ${
            pageStyle === 'ruled'
              ? `
            .page-sheet {
              padding-left: 65px !important;
            }
            .page-sheet::before {
              content: '';
              position: absolute;
              left: 50px;
              top: 0;
              bottom: 0;
              width: 1.5px;
              background-color: ${marginColor};
            }
          `
              : ''
          }

          /* Aligns text directly to next line (No double-line margin!) */
          .page-sheet p, .page-sheet div, .page-sheet span {
            margin: 0; 
            line-height: 30px;
            font-size: 16px;
          }
          .page-sheet h1, .page-sheet h2, .page-sheet h3 {
            margin: 0;
            line-height: 30px;
            font-size: 20px;
            font-weight: bold;
            color: ${headingColor};
          }
          .page-sheet ul, .page-sheet ol {
            margin: 0;
            padding-left: 25px;
          }
          .page-sheet li {
            line-height: 30px;
            font-size: 16px;
          }

          .page-sheet img {
            max-width: 100%;
            border-radius: 8px;
            margin: 15px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          }

          /* Drawing Pad Modal */
          #canvas-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #121212;
            z-index: 1000;
            flex-direction: column;
          }
          #canvas-toolbar {
            background: #1E1E1E;
            padding: 12px;
            display: flex;
            gap: 10px;
            align-items: center;
            border-bottom: 1px solid #333;
            flex-wrap: wrap;
          }
          #sketchpad-container {
            flex: 1;
            position: relative;
            background-color: ${pageColor};
            box-sizing: border-box;
            display: flex;

            /* Ruled Paper Style background */
            ${
              pageStyle === 'ruled'
                ? `
              background-image: linear-gradient(${lineColor} 1px, transparent 1px);
              background-size: 100% 30px;
              background-position: 0 35px;
            `
                : ''
            }

            /* Grid Paper Style background */
            ${
              pageStyle === 'grid'
                ? `
              background-image: linear-gradient(${lineColor} 1px, transparent 1px),
                                linear-gradient(90deg, ${lineColor} 1px, transparent 1px);
              background-size: 30px 30px;
              background-position: 0 35px;
            `
                : ''
            }
          }
          #sketchpad {
            flex: 1;
            background: transparent;
            touch-action: none;
            z-index: 2;
          }
          /* Left margin line for ruled drawing pad */
          ${
            pageStyle === 'ruled'
              ? `
            #sketchpad-container::before {
              content: '';
              position: absolute;
              left: 50px;
              top: 0;
              bottom: 0;
              width: 1.5px;
              background-color: ${marginColor};
              z-index: 1;
              pointer-events: none;
            }
          `
              : ''
          }
          .palette {
            display: flex;
            gap: 6px;
          }
          .color-dot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #555;
          }
          .color-dot.active {
            border-color: #fff;
            transform: scale(1.1);
          }
          /* Speech feedback overlay */
          #speech-overlay {
            display: none;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            padding: 10px 20px;
            border-radius: 20px;
            align-items: center;
            gap: 10px;
            border: 1px solid #00B3B3;
            z-index: 999;
          }
          .mic-pulse {
            width: 12px;
            height: 12px;
            background-color: #FF2E2E;
            border-radius: 50%;
            animation: pulse 1s infinite alternate;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.4); opacity: 1; }
          }
          #speech-preview {
            color: #FFF;
            font-size: 14px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>

        <div id="toolbar">
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatDoc('bold')"><b>B</b></button>
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatDoc('italic')"><i>I</i></button>
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="highlightSelection()">Highlight</button>
          
          <!-- Colored Circular Palette -->
          <div class="color-palette">
            <button class="color-btn active" onmousedown="event.preventDefault()" style="background-color: ${textColor};" onclick="setTypingColor('${textColor}', this)"></button>
            <button class="color-btn" onmousedown="event.preventDefault()" style="background-color: #FF4C4C;" onclick="setTypingColor('#FF4C4C', this)"></button>
            <button class="color-btn" onmousedown="event.preventDefault()" style="background-color: #4C9CFF;" onclick="setTypingColor('#4C9CFF', this)"></button>
            <button class="color-btn" onmousedown="event.preventDefault()" style="background-color: #4CFF4C;" onclick="setTypingColor('#4CFF4C', this)"></button>
            <button class="color-btn" onmousedown="event.preventDefault()" style="background-color: #FFEB3B;" onclick="setTypingColor('#FFEB3B', this)"></button>
          </div>

          <!-- Font Size Selector -->
          <select id="fontSize" onmousedown="event.preventDefault()" onchange="formatDoc('fontSize', this.value)" style="background: #2D2D2D; color:#fff; border:1px solid #444; border-radius:6px; padding:6px; margin-right:8px; outline:none;">
            <option value="3">Font Size</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Medium</option>
            <option value="5">Large</option>
            <option value="6">X-Large</option>
          </select>

          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="openDrawingPad()">🎨 Draw</button>
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="pickImage()">🖼️ Image</button>
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="addNewPage()" style="background-color: #008080;">+ Page</button>
          
          <button id="mic-btn" class="tool-btn" onmousedown="event.preventDefault()" onclick="toggleSpeech()">🎙️ Start Voice</button>
          <button class="tool-btn" onmousedown="event.preventDefault()" onclick="triggerAISummarize()" style="background-color: #9C27B0;">✨ AI Summarize</button>
        </div>

        <div id="editor-container">
          <!-- Image Popover Alignment & Size Tools -->
          <div id="image-tools" style="display: none; position: absolute; background: #222; border: 1px solid #00B3B3; border-radius: 6px; padding: 4px; z-index: 10000; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); align-items: center; flex-wrap: wrap; max-width: 250px;">
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="alignImage('left')">⬅️ Left</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="alignImage('center')">🟩 Center</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="alignImage('right')">➡️ Right</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="resizeImage('25%')">25%</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="resizeImage('50%')">50%</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="resizeImage('75%')">75%</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0;" onclick="resizeImage('100%')">100%</button>
            <button class="tool-btn" style="padding: 4px 6px; font-size: 11px; margin:0; background-color: #8B0000;" onclick="deleteImage()">🗑️</button>
          </div>

          <div id="pages-wrapper">
            ${(currentPage?.content || '').indexOf('page-sheet') !== -1 ? (currentPage?.content || '') : `
              <div class="page-sheet" contenteditable="${!isReadOnly}" id="page-1" oninput="saveContent()" spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off">
                ${currentPage?.content || ''}
              </div>
            `
            }
          </div>
        </div>

        <!-- Speech Preview HUD -->
        <div id="speech-overlay">
          <div class="mic-pulse"></div>
          <div id="speech-preview">Listening...</div>
        </div>

        <!-- Canvas Drawing Sketchpad -->
        <div id="canvas-modal">
          <div id="canvas-toolbar">
            <button class="tool-btn" onclick="closeDrawingPad()">Cancel</button>
            <div class="palette">
              <div class="color-dot active" style="background: ${textColor};" onclick="setCanvasColor('${textColor}', this)"></div>
              <div class="color-dot" style="background: #FF4C4C;" onclick="setCanvasColor('#FF4C4C', this)"></div>
              <div class="color-dot" style="background: #4C9CFF;" onclick="setCanvasColor('#4C9CFF', this)"></div>
              <div class="color-dot" style="background: #4CFF4C;" onclick="setCanvasColor('#4CFF4C', this)"></div>
              <div class="color-dot" style="background: #FFEB3B;" onclick="setCanvasColor('#FFEB3B', this)"></div>
            </div>
            
            <button id="eraser-btn" class="tool-btn" onclick="toggleEraser()">🧽 Eraser</button>
            
            <select id="brushSize" onchange="setBrushSize(this.value)" style="background: #2D2D2D; color:#fff; border:1px solid #444; border-radius:6px; padding:6px;">
              <option value="4">Small Brush</option>
              <option value="8">Medium Brush</option>
              <option value="15">Large Brush</option>
            </select>
            
            <button class="tool-btn" onclick="undoCanvas()">↩️ Undo</button>
            <button class="tool-btn" onclick="redoCanvas()">↪️ Redo</button>
            <button class="tool-btn" onclick="clearCanvas()">Clear</button>
            
            <button class="tool-btn" onclick="insertCanvasDrawing()" style="background: #008080;">Insert inline</button>
            <button class="tool-btn" onclick="saveCanvasAsPage()" style="background: #FF8C00;">Save as Page</button>
          </div>
          <div id="sketchpad-container">
            <canvas id="sketchpad"></canvas>
          </div>
        </div>

        <script>
          function sendMessage(obj) {
            window.ReactNativeWebView.postMessage(JSON.stringify(obj));
          }

          // Format document content
          function formatDoc(cmd, val = null) {
            if (${isReadOnly}) return;
            document.execCommand(cmd, false, val);
            saveContent();
          }

          function setTypingColor(color, element) {
            if (${isReadOnly}) return;
            document.execCommand('foreColor', false, color);
            document.querySelectorAll('.color-btn').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
          }

          function highlightSelection() {
            formatDoc('backColor', 'rgba(255, 235, 59, 0.4)');
          }

          function saveContent() {
            if (${isReadOnly}) return;
            const html = document.getElementById('pages-wrapper').innerHTML;
            sendMessage({ type: 'SAVE', html: html });
          }

          function pickImage() {
            sendMessage({ type: 'PICK_IMAGE' });
          }

          // Append new paper page sheet
          function addNewPage(content = '<p><br></p>') {
            if (${isReadOnly}) return;
            const wrapper = document.getElementById('pages-wrapper');
            const pageNum = wrapper.children.length + 1;
            
            const newPage = document.createElement('div');
            newPage.className = 'page-sheet';
            newPage.contentEditable = !${isReadOnly};
            newPage.id = 'page-' + pageNum;
            newPage.setAttribute('spellcheck', 'false');
            newPage.setAttribute('autocorrect', 'off');
            newPage.setAttribute('autocapitalize', 'off');
            newPage.setAttribute('autocomplete', 'off');
            newPage.innerHTML = content;
            newPage.oninput = saveContent;
            
            wrapper.appendChild(newPage);
            newPage.scrollIntoView({ behavior: 'smooth' });
            saveContent();
          }

          // Mobile Touch & Pinch Gestures for Resizing Images (passive: false to allow e.preventDefault())
          let activeImg = null;
          let startWidth, startHeight;
          let startDist = 0;

          document.getElementById('pages-wrapper').addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'IMG' && !${isReadOnly}) {
              activeImg = e.target;
              startWidth = activeImg.clientWidth;
              startHeight = activeImg.clientHeight;
              
              if (e.touches.length === 2) {
                // Two-finger pinch
                startDist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
              } else if (e.touches.length === 1) {
                // One-finger resize handle (bottom-right edge)
                const rect = activeImg.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;
                
                if (touchX > rect.width - 45 && touchY > rect.height - 45) {
                  activeImg.isResizing = true;
                  activeImg.startX = e.touches[0].clientX;
                  activeImg.startWidth = rect.width;
                  e.preventDefault();
                }
              }
            }
          }, { passive: false });

          document.getElementById('pages-wrapper').addEventListener('touchmove', (e) => {
            if (!activeImg) return;
            
            if (e.touches.length === 2 && startDist > 0) {
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              const factor = dist / startDist;
              activeImg.style.width = (startWidth * factor) + 'px';
              activeImg.style.height = 'auto';
            } else if (e.touches.length === 1 && activeImg.isResizing) {
              const deltaX = e.touches[0].clientX - activeImg.startX;
              const newWidth = activeImg.startWidth + deltaX;
              activeImg.style.width = Math.max(80, newWidth) + 'px';
              activeImg.style.height = 'auto';
              e.preventDefault();
            }
          }, { passive: false });

          document.getElementById('pages-wrapper').addEventListener('touchend', (e) => {
            if (activeImg) {
              activeImg.isResizing = false;
              activeImg = null;
              startDist = 0;
              saveContent();
            }
          });

          // Tapping an image opens alignment/deletion popover
          let selectedImg = null;

          document.getElementById('pages-wrapper').addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && !${isReadOnly}) {
              selectedImg = e.target;
              document.querySelectorAll('img').forEach(img => img.classList.remove('selected-image'));
              selectedImg.classList.add('selected-image');
              
              // Position tools popover relative to the image coordinates inside the scrolling container
              const rect = selectedImg.getBoundingClientRect();
              const containerRect = document.getElementById('editor-container').getBoundingClientRect();
              const tools = document.getElementById('image-tools');
              
              tools.style.display = 'flex';
              // Calculate correct absolute position regardless of flex nesting
              tools.style.top = (rect.top - containerRect.top + document.getElementById('editor-container').scrollTop - 45) + 'px';
              tools.style.left = (rect.left - containerRect.left + document.getElementById('editor-container').scrollLeft) + 'px';
            } else {
              document.getElementById('image-tools').style.display = 'none';
              document.querySelectorAll('img').forEach(img => img.classList.remove('selected-image'));
              selectedImg = null;
            }
          });

          function alignImage(align) {
            if (!selectedImg) return;
            if (align === 'left') {
              selectedImg.style.display = 'block';
              selectedImg.style.margin = '15px 0';
            } else if (align === 'center') {
              selectedImg.style.display = 'block';
              selectedImg.style.margin = '15px auto';
            } else if (align === 'right') {
              selectedImg.style.display = 'block';
              selectedImg.style.margin = '15px 0 15px auto';
            }
            // Reposition the toolbar after moving
            setTimeout(() => {
              const rect = selectedImg.getBoundingClientRect();
              const containerRect = document.getElementById('editor-container').getBoundingClientRect();
              const tools = document.getElementById('image-tools');
              tools.style.top = (rect.top - containerRect.top + document.getElementById('editor-container').scrollTop - 45) + 'px';
              tools.style.left = (rect.left - containerRect.left + document.getElementById('editor-container').scrollLeft) + 'px';
            }, 50);
            saveContent();
          }

          function resizeImage(percent) {
            if (!selectedImg) return;
            selectedImg.style.width = percent;
            selectedImg.style.height = 'auto';
            setTimeout(() => {
              const rect = selectedImg.getBoundingClientRect();
              const containerRect = document.getElementById('editor-container').getBoundingClientRect();
              const tools = document.getElementById('image-tools');
              tools.style.top = (rect.top - containerRect.top + document.getElementById('editor-container').scrollTop - 45) + 'px';
              tools.style.left = (rect.left - containerRect.left + document.getElementById('editor-container').scrollLeft) + 'px';
            }, 50);
            saveContent();
          }

          function deleteImage() {
            if (!selectedImg) return;
            selectedImg.remove();
            document.getElementById('image-tools').style.display = 'none';
            saveContent();
          }

          function insertImage(base64Data) {
            if (${isReadOnly}) return;
            const img = document.createElement('img');
            img.src = base64Data;
            img.contentEditable = false;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              const br = document.createElement('br');
              range.insertNode(br);
            } else {
              // Append to last page if no cursor
              const wrapper = document.getElementById('pages-wrapper');
              wrapper.lastElementChild.appendChild(img);
            }
            saveContent();
          }

          // Drawing Pad Logic
          const canvas = document.getElementById('sketchpad');
          const ctx = canvas.getContext('2d');
          let drawing = false;
          let canvasColor = '${textColor}';
          let canvasBrushSize = 4;
          
          let canvasHistory = [];
          let historyStep = -1;
          let isEraser = false;

          function openDrawingPad() {
            document.getElementById('canvas-modal').style.display = 'flex';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 60;
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = canvasColor;
            ctx.lineWidth = canvasBrushSize;

            canvasHistory = [];
            historyStep = -1;
            isEraser = false;
            document.getElementById('eraser-btn').classList.remove('active');
            ctx.globalCompositeOperation = 'source-over';

            saveCanvasState();
          }

          function saveCanvasState() {
            historyStep++;
            if (historyStep < canvasHistory.length) {
              canvasHistory.length = historyStep;
            }
            canvasHistory.push(canvas.toDataURL());
            if (canvasHistory.length > 25) {
              canvasHistory.shift();
              historyStep--;
            }
          }

          function undoCanvas() {
            if (historyStep > 0) {
              historyStep--;
              const canvasPic = new Image();
              canvasPic.src = canvasHistory[historyStep];
              canvasPic.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(canvasPic, 0, 0);
              }
            }
          }

          function redoCanvas() {
            if (historyStep < canvasHistory.length - 1) {
              historyStep++;
              const canvasPic = new Image();
              canvasPic.src = canvasHistory[historyStep];
              canvasPic.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(canvasPic, 0, 0);
              }
            }
          }

          function toggleEraser() {
            isEraser = !isEraser;
            const btn = document.getElementById('eraser-btn');
            if (isEraser) {
              btn.classList.add('active');
              ctx.globalCompositeOperation = 'destination-out';
              ctx.lineWidth = 20; 
            } else {
              btn.classList.remove('active');
              ctx.globalCompositeOperation = 'source-over';
              ctx.lineWidth = canvasBrushSize;
              ctx.strokeStyle = canvasColor;
            }
          }

          function closeDrawingPad() {
            document.getElementById('canvas-modal').style.display = 'none';
          }

          function setCanvasColor(color, element) {
            if (isEraser) toggleEraser();
            canvasColor = color;
            ctx.strokeStyle = color;
            document.querySelectorAll('.color-dot').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
          }

          function setBrushSize(size) {
            canvasBrushSize = size;
            if (!isEraser) {
              ctx.lineWidth = size;
            }
          }

          function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveCanvasState();
          }

          function getTouchPos(e) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0] || (e.changedTouches && e.changedTouches[0]);
            return {
              x: touch ? (touch.clientX - rect.left) : 0,
              y: touch ? (touch.clientY - rect.top) : 0
            };
          }

          canvas.addEventListener('touchstart', (e) => {
            drawing = true;
            const pos = getTouchPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
          }, { passive: false });

          canvas.addEventListener('touchmove', (e) => {
            if (!drawing) return;
            const pos = getTouchPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
          }, { passive: false });

          canvas.addEventListener('touchend', (e) => {
            if (drawing) {
              drawing = false;
              saveCanvasState();
            }
          });

          function insertCanvasDrawing() {
            const dataUrl = canvas.toDataURL('image/png');
            insertImage(dataUrl);
            closeDrawingPad();
          }

          function saveCanvasAsPage() {
            const dataUrl = canvas.toDataURL('image/png');
            addNewPage('<p><img src="' + dataUrl + '" /></p>');
            closeDrawingPad();
          }

          function getNewWords(oldText, newText) {
            const oldWords = oldText.trim().toLowerCase().split(/\s+/).filter(Boolean);
            const newWords = newText.trim().split(/\s+/).filter(Boolean);
            
            if (newWords.length === 0) return '';
            if (oldWords.length === 0) return newText;

            // Find matching words count at the start
            let matchCount = 0;
            const maxCheck = Math.min(oldWords.length, newWords.length);
            for (let i = 0; i < maxCheck; i++) {
              if (newWords[i].toLowerCase() === oldWords[i]) {
                matchCount++;
              } else {
                break;
              }
            }

            // If the matching words cover the entire newText, there are no new words to insert
            if (matchCount === newWords.length) {
              return '';
            }

            // If we have a prefix match, return only the remaining new words
            if (matchCount > 0) {
              return newWords.slice(matchCount).join(' ');
            }

            // Otherwise, it is a completely new segment (e.g. user paused and restarted)
            return newText;
          }

          // Web Speech Recognition
          let recognition;
          let isListening = false;
          let shouldBeListening = false;
          let finalResultsOffset = 0;
          let speechStartRange = null;
   
           try {
             const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
             recognition = new SpeechRecognition();
             recognition.continuous = true;
             recognition.interimResults = true;
             recognition.lang = 'en-US';
  
             recognition.onstart = () => {
                isListening = true;
                finalResultsOffset = 0;
                
                // Ensure focus and cursor are active on a page-sheet, then save the selection range
                const wrapper = document.getElementById('pages-wrapper');
                let activeSheet = document.activeElement;
                if (!activeSheet || !activeSheet.classList.contains('page-sheet')) {
                  activeSheet = wrapper.lastElementChild;
                  activeSheet.focus();
                }
                
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                  speechStartRange = sel.getRangeAt(0).cloneRange();
                } else {
                  speechStartRange = document.createRange();
                  speechStartRange.selectNodeContents(activeSheet);
                  speechStartRange.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(speechStartRange);
                }

                document.getElementById('mic-btn').textContent = '⏹️ Stop Voice';
                document.getElementById('mic-btn').classList.add('active');
                document.getElementById('speech-overlay').style.display = 'flex';
              };
 
              recognition.onresult = (event) => {
                let cleanFinalTranscript = '';
                let lastPhrase = '';
                
                for (let i = 0; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                    let phrase = event.results[i][0].transcript.trim();
                    if (phrase) {
                      if (lastPhrase && phrase.toLowerCase().startsWith(lastPhrase.toLowerCase())) {
                        let index = cleanFinalTranscript.toLowerCase().lastIndexOf(lastPhrase.toLowerCase());
                        if (index !== -1) {
                          cleanFinalTranscript = cleanFinalTranscript.substring(0, index) + phrase;
                        } else {
                          cleanFinalTranscript = phrase;
                        }
                      } else {
                        cleanFinalTranscript = (cleanFinalTranscript ? cleanFinalTranscript + ' ' : '') + phrase;
                      }
                      lastPhrase = phrase;
                    }
                  }
                }
 
                let displayFinal = cleanFinalTranscript.trim();
                
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (!event.results[i].isFinal) {
                    interimTranscript = event.results[i][0].transcript;
                  }
                }
                let displayInterim = interimTranscript.trim();
 
                // Update the preview badge
                document.getElementById('speech-preview').textContent = displayFinal || displayInterim || 'Listening...';
 
                if (speechStartRange) {
                  if (displayFinal) {
                    let lowercaseText = displayFinal.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_\`~()]/g,"").trim();
 
                    // Check for formatting commands at the end of final text
                    let isCommandTriggered = false;
                    let cleanText = displayFinal;
                    let commandType = '';
 
                    if (lowercaseText === 'next paragraph' || lowercaseText === 'new paragraph' || lowercaseText === 'paragraph' || lowercaseText === 'next page' || lowercaseText === 'new page' || lowercaseText === 'page') {
                      isCommandTriggered = true;
                      cleanText = '';
                      commandType = 'paragraph';
                    } else if (lowercaseText === 'bullet point' || lowercaseText === 'new point' || lowercaseText === 'bullet' || lowercaseText === 'bulletin' || lowercaseText === 'bullet points') {
                      isCommandTriggered = true;
                      cleanText = '';
                      commandType = 'bullet';
                    } else if (lowercaseText === 'clear page') {
                      isCommandTriggered = true;
                      cleanText = '';
                      commandType = 'clear';
                    } else if (lowercaseText === 'bold' || lowercaseText === 'italic') {
                      isCommandTriggered = true;
                      cleanText = '';
                      commandType = lowercaseText;
                    } else if (lowercaseText.endsWith('next paragraph') || lowercaseText.endsWith('new paragraph') || lowercaseText.endsWith('next page') || lowercaseText.endsWith('new page') || lowercaseText.endsWith(' paragraph') || lowercaseText.endsWith(' page')) {
                      isCommandTriggered = true;
                      commandType = 'paragraph';
                      let cutIndex = displayFinal.toLowerCase().lastIndexOf('paragraph');
                      if (cutIndex === -1) cutIndex = displayFinal.toLowerCase().lastIndexOf('page');
                      
                      let rawClean = displayFinal.substring(0, cutIndex).trim();
                      if (rawClean.toLowerCase().endsWith('next')) {
                        rawClean = rawClean.substring(0, rawClean.toLowerCase().lastIndexOf('next')).trim();
                      }
                      if (rawClean.toLowerCase().endsWith('new')) {
                        rawClean = rawClean.substring(0, rawClean.toLowerCase().lastIndexOf('new')).trim();
                      }
                      cleanText = rawClean;
                    } else if (lowercaseText.endsWith('bullet point') || lowercaseText.endsWith('new point') || lowercaseText.endsWith('bulletin') || lowercaseText.endsWith('bullet points') || lowercaseText.endsWith(' bullet')) {
                      isCommandTriggered = true;
                      commandType = 'bullet';
                      let cutIndex = displayFinal.toLowerCase().lastIndexOf('point');
                      if (cutIndex === -1) cutIndex = displayFinal.toLowerCase().lastIndexOf('bulletin');
                      if (cutIndex === -1) cutIndex = displayFinal.toLowerCase().lastIndexOf('bullet');
                      
                      let rawClean = displayFinal.substring(0, cutIndex).trim();
                      if (rawClean.toLowerCase().endsWith('new')) {
                        rawClean = rawClean.substring(0, rawClean.toLowerCase().lastIndexOf('new')).trim();
                      }
                      cleanText = rawClean;
                    }
 
                    if (isCommandTriggered) {
                      // 1. Select and delete the old text in this session
                      const sel = window.getSelection();
                      sel.removeAllRanges();
                      const endRange = document.createRange();
                      endRange.setStart(speechStartRange.startContainer, speechStartRange.startOffset);
                      const activeSheet = document.activeElement || document.getElementById('pages-wrapper').lastElementChild;
                      endRange.setEnd(activeSheet, activeSheet.childNodes.length);
                      sel.addRange(endRange);
                      document.execCommand('delete');
 
                      // 2. Insert the clean text before command
                      if (cleanText) {
                        let refinedActive = '';
                        let lastActiveP = '';
                        for (let idx = finalResultsOffset; idx < event.results.length; ++idx) {
                          if (event.results[idx].isFinal) {
                            let phrase = event.results[idx][0].transcript.trim();
                            if (phrase) {
                              if (lastActiveP && phrase.toLowerCase().startsWith(lastActiveP.toLowerCase())) {
                                let index = refinedActive.toLowerCase().lastIndexOf(lastActiveP.toLowerCase());
                                if (index !== -1) {
                                  refinedActive = refinedActive.substring(0, index) + phrase;
                                } else {
                                  refinedActive = phrase;
                                }
                              } else {
                                refinedActive = (refinedActive ? refinedActive + ' ' : '') + phrase;
                              }
                              lastActiveP = phrase;
                            }
                          }
                        }
                        
                        let commandWord = displayFinal.substring(cleanText.length).trim().toLowerCase();
                        if (commandWord && refinedActive.toLowerCase().endsWith(commandWord)) {
                          refinedActive = refinedActive.substring(0, refinedActive.toLowerCase().lastIndexOf(commandWord)).trim();
                        }
 
                        if (refinedActive.trim()) {
                          document.execCommand('insertText', false, ' ' + refinedActive.trim());
                        }
                      }
 
                      // 3. Execute formatting command
                      if (commandType === 'paragraph') {
                        formatDoc('insertHTML', '<p><br></p>');
                      } else if (commandType === 'bullet') {
                        formatDoc('insertHTML', '<ul><li>&nbsp;</li></ul>');
                      } else if (commandType === 'clear') {
                        if (activeSheet) activeSheet.innerHTML = '<p><br></p>';
                        saveContent();
                      } else if (commandType === 'bold') {
                        formatDoc('bold');
                      } else if (commandType === 'italic') {
                        formatDoc('italic');
                      }
 
                      // 4. Reset start range to the new cursor position for the next part of the session
                      sel.removeAllRanges();
                      const newRange = document.createRange();
                      newRange.selectNodeContents(activeSheet);
                      newRange.collapse(false);
                      sel.addRange(newRange);
                      speechStartRange = newRange.cloneRange();
 
                      // 5. Restart recognition results offset
                      finalResultsOffset = event.results.length;
                    } else {
                      // No command: update the document text cleanly using the refined loop
                      let activeFinalText = '';
                      let activeLastPhrase = '';
                      for (let idx = finalResultsOffset; idx < event.results.length; ++idx) {
                        if (event.results[idx].isFinal) {
                          let phrase = event.results[idx][0].transcript.trim();
                          if (phrase) {
                            if (activeLastPhrase && phrase.toLowerCase().startsWith(activeLastPhrase.toLowerCase())) {
                              let index = activeFinalText.toLowerCase().lastIndexOf(activeLastPhrase.toLowerCase());
                              if (index !== -1) {
                                  activeFinalText = activeFinalText.substring(0, index) + phrase;
                              } else {
                                  activeFinalText = phrase;
                              }
                            } else {
                              activeFinalText = (activeFinalText ? activeFinalText + ' ' : '') + phrase;
                            }
                            activeLastPhrase = phrase;
                          }
                        }
                      }
                      
                      const sel = window.getSelection();
                      sel.removeAllRanges();
                      const endRange = document.createRange();
                      endRange.setStart(speechStartRange.startContainer, speechStartRange.startOffset);
                      const activeSheet = document.activeElement || document.getElementById('pages-wrapper').lastElementChild;
                      endRange.setEnd(activeSheet, activeSheet.childNodes.length);
                      sel.addRange(endRange);
                      document.execCommand('delete');
 
                      let textToInsert = (activeFinalText ? activeFinalText : '') + (displayInterim ? ' ' + displayInterim : '');
                      if (textToInsert.trim()) {
                        document.execCommand('insertText', false, ' ' + textToInsert.trim());
                      }
                    }
                  } else if (displayInterim) {
                    // Update interim text cleanly
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const endRange = document.createRange();
                    endRange.setStart(speechStartRange.startContainer, speechStartRange.startOffset);
                    const activeSheet = document.activeElement || document.getElementById('pages-wrapper').lastElementChild;
                    endRange.setEnd(activeSheet, activeSheet.childNodes.length);
                    sel.addRange(endRange);
                    document.execCommand('delete');
 
                    if (displayInterim.trim()) {
                      document.execCommand('insertText', false, ' ' + displayInterim.trim());
                    }
                  }
                }
              };
  
              recognition.onend = () => {
                if (shouldBeListening) {
                  // If ended automatically by browser silence timeouts, restart listening
                  try {
                    recognition.start();
                  } catch (err) {
                    console.warn('Speech engine restart failed:', err);
                  }
                } else {
                  isListening = false;
                  document.getElementById('mic-btn').textContent = '🎙️ Start Voice';
                  document.getElementById('mic-btn').classList.remove('active');
                  document.getElementById('speech-overlay').style.display = 'none';
                }
              };

            recognition.onerror = (e) => {
              alert('Speech Recognition Error: "' + e.error + '"\\n\\nIf Gboard speech-to-text works on your keyboard, use that. Otherwise, Google Speech Services is missing or disabled in your Android emulator settings.');
              sendMessage({ type: 'SPEECH_ERROR', error: e.error });
            };

          } catch (e) {
            console.warn('Speech Recognition not supported', e);
          }

          function triggerAISummarize() {
            const content = document.getElementById('editor-container').innerHTML;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AI_SUMMARIZE',
              content: content
            }));
          }

          function toggleSpeech() {
            try {
              if (!recognition) {
                alert('Speech typing is not supported natively in this browser/device. Try using the microphone button on your mobile keyboard spacebar!');
                return;
              }
              if (isListening) {
                shouldBeListening = false;
                recognition.stop();
              } else {
                // Ensure focus and cursor are active on a page-sheet
                const wrapper = document.getElementById('pages-wrapper');
                let activeSheet = document.activeElement;
                if (!activeSheet || !activeSheet.classList.contains('page-sheet')) {
                  activeSheet = wrapper.lastElementChild;
                  activeSheet.focus();
                  
                  // Move caret cursor to the end of the text
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents(activeSheet);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
                
                shouldBeListening = true;
                sendMessage({ type: 'REQUEST_MIC_PERMISSION' });
                recognition.start();
              }
            } catch (err) {
              alert('Speech Engine Activation Error: ' + err.message);
            }
          }

          // Auto-cleanup legacy placeholder text on focus/typing
          document.getElementById('pages-wrapper').addEventListener('focusin', function(e) {
            const sheet = e.target.closest('.page-sheet');
            if (sheet) {
              const text = sheet.innerText.trim();
              if (text.includes('Start writing here...') && text.includes('Tap the microphone')) {
                sheet.innerHTML = '';
                saveContent();
              }
            }
          });

          // Make sure all loaded images are non-editable to support touch events
          document.querySelectorAll('img').forEach(img => {
            img.contentEditable = false;
          });
        </script>
      </body>
      </html>
    `;

    return (
      <View style={styles.container}>
        <Card
          style={[styles.headerCard, {backgroundColor: currentNotebook.color}]}>
          <Card.Content style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={28}
              onPress={() => setViewState('pages')}
            />
            <View style={{flex: 1}}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {currentPage.title}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isReadOnly ? 'Read Only Guide' : 'Editing Notebook'}
              </Text>
            </View>
            {!isReadOnly && (
              <IconButton
                icon="content-save"
                iconColor="#fff"
                size={24}
                onPress={() => {
                  webViewRef.current?.injectJavaScript('saveContent();');
                  Alert.alert('Saved', 'Notebook pages saved successfully.');
                }}
              />
            )}
          </Card.Content>
        </Card>

        <WebView
          ref={webViewRef}
          source={{html: htmlTemplate}}
          originWhitelist={['*']}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          permissionGrantPromptBehavior="grant"
          mixedContentMode="always"
          scalesPageToFit={true}
          onPermissionRequest={request => {
            request.grant(request.resources);
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.rootContainer, {backgroundColor: colors.background}]}>
      {viewState === 'notebooks' && renderNotebooks()}
      {viewState === 'pages' && renderPages()}
      {viewState === 'editor' && renderEditor()}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 12,
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  listPadding: {
    paddingBottom: 80,
    paddingHorizontal: 6,
  },
  notebookCardContainer: {
    width: '50%',
    padding: 8,
  },

  // Custom Physical Book Cover Styles
  bookCover: {
    height: 180,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: {width: 3, height: 4},
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bookSpineLine: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bookTitleCard: {
    width: '72%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#D4AF37', // Gold embossed borders
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 18,
  },
  bookDivider: {
    width: '50%',
    height: 1,
    backgroundColor: '#D4AF37',
    marginVertical: 4,
  },
  bookMeta: {
    fontSize: 8,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bookRibbon: {
    position: 'absolute',
    right: 14,
    top: 0,
    width: 10,
    height: 36,
    backgroundColor: '#D4AF37',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },

  // List Views & Dialog Options
  customDialog: {},
  dialogInput: {
    marginBottom: 12,
  },
  dialogSectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
    color: '#FFF',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
  },
  pageColorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#444',
  },
  colorOptionSelected: {
    borderColor: '#D4AF37',
    transform: [{scale: 1.15}],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAA',
    marginTop: 10,
    textAlign: 'center',
  },
  pageCard: {
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  pageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageDate: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Miniature representation of page style inside list cards
  pageIndicator: {
    width: 36,
    height: 48,
    borderRadius: 3,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 1,
  },
  miniRuledLines: {
    width: '70%',
    height: '60%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  miniGridLines: {
    width: '70%',
    height: '60%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
});
