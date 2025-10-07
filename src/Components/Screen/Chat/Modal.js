import {View, Text, Modal, StyleSheet, Pressable} from 'react-native';
import {PickImage, PickVideo, PickDoc} from '../../../Utils/Image';
import axios from 'axios';
import {useState} from 'react';

const AttachmentModal = ({showAttachmentPicker, setShowAttachmentPicker}) => {
  const [uploading, setUploading] = useState(false);

  const selectImage = async () => {
    const result = await PickImage();
    if (result) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', {
          uri: result.uri,
          type: result.type,
          name: result.fileName || 'upload.jpg',
        });

        const response = await axios.post(
          'https://studifysuccess.com/app/api/uploadImage',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        console.log('Upload Success:', response.data);
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const selectVideo = async () => {
    const result = await PickVideo();
    if (result) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('video', {
          uri: result.uri,
          type: result.type,
          name: result.fileName || 'upload.mp4',
        });

        const response = await axios.post(
          'https://studifysuccess.com/app/api/uploadVideo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        console.log('Upload Success:', response.data);
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const selectDoc = async () => {
    const result = await PickDoc();
    console.log(result);
    return;
    if (result) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('video', {
          uri: result.uri,
          type: result.type,
          name: result.fileName || 'upload.mp4',
        });

        const response = await axios.post(
          'https://studifysuccess.com/app/api/uploadVideo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        console.log('Upload Success:', response.data);
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={showAttachmentPicker}
      onRequestClose={() => setShowAttachmentPicker(false)}>
      <Pressable
        style={styles.attachmentOverlay}
        onPress={() => setShowAttachmentPicker(false)}>
        <View style={styles.attachmentSheet}>
          <Text style={styles.attachTitle}>Attach</Text>
          <Pressable style={styles.attachBtn} onPress={selectImage}>
            <Text style={styles.attachBtnText}>Image </Text>
          </Pressable>
          <Pressable style={styles.attachBtn} onPress={selectVideo}>
            <Text style={styles.attachBtnText}>Video</Text>
          </Pressable>
          <Pressable style={styles.attachBtn} onPress={selectDoc}>
            <Text style={styles.attachBtnText}>Document</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  attachmentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    backgroundColor: '#222',
    padding: 16,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  attachTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  attachBtn: {
    paddingVertical: 12,
  },
  attachBtnText: {color: '#fff', fontSize: 15},
});

export default AttachmentModal;
