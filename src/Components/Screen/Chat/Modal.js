import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {PickImage, PickVideo, PickDoc} from '../../../Utils/Image';
import axios from 'axios';
import {useState} from 'react';
import {Text} from '../../Input';
import {useTheme} from 'react-native-paper';
import FlashMessage from '../FlashMessage';

const AttachmentModal = ({
  showAttachmentPicker,
  setShowAttachmentPicker,
  onSendAttachment,
}) => {
  const [uploading, setUploading] = useState(false);
  const {colors} = useTheme();

  const selectImage = async () => {
    const results = await PickImage();
    if (results && results.length > 0) {
      try {
        setUploading(true);
        const formData = new FormData();

        results.forEach((img, index) => {
          formData.append('images[]', {
            uri: img.uri,
            type: img.type,
            name: img.fileName || `upload_${index}.jpg`,
          });
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
        if (!response?.data?.success) {
          FlashMessage({
            message: response?.data?.message || 'Upload failed',
            type: 'danger',
          });
          throw new Error(response?.data?.message || 'Upload failed');
        }
        const url = response?.data?.urls;
        if (url) {
          onSendAttachment({type: 'image', url});
        }
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
        setShowAttachmentPicker(false);
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
        if (!response?.data?.success) {
          FlashMessage({
            message: response?.data?.message || 'Upload failed',
            type: 'danger',
          });
          throw new Error(response?.data?.message || 'Upload failed');
        }
        const url = response?.data?.url;
        if (url && typeof onSendAttachment === 'function') {
          onSendAttachment({type: 'video', url});
        }
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
        setShowAttachmentPicker(false);
      }
    }
  };

  const selectDoc = async () => {
    const result = await PickDoc();
    if (result) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('document', {
          uri: result.uri,
          type: result.type,
          name: result.fileName || 'upload.pdf',
        });

        const response = await axios.post(
          'https://studifysuccess.com/app/api/uploadDoc',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        console.log('Upload Success:', response.data);
        if (!response?.data?.success) {
          FlashMessage({
            message: response?.data?.message || 'Upload failed',
            type: 'danger',
          });
          throw new Error(response?.data?.message || 'Upload failed');
        }
        const url = response?.data?.url;
        if (url && typeof onSendAttachment === 'function') {
          onSendAttachment({type: 'document', url});
        }
      } catch (error) {
        console.error('Upload Error:', error.message);
      } finally {
        setUploading(false);
        setShowAttachmentPicker(false);
      }
    }
  };

  const closeModal = () => {
    if (uploading) return;
    setShowAttachmentPicker(false);
  };
  return (
    <Modal
      transparent
      animationType="fade"
      visible={showAttachmentPicker}
      onRequestClose={closeModal}>
      <Pressable style={styles.attachmentOverlay} onPress={closeModal}>
        {uploading ? (
          <View
            style={[
              styles.attachmentSheet,
              {
                backgroundColor: colors.background,
                justifyContent: 'center',
              },
            ]}>
            <ActivityIndicator size="large" color={colors.onBackground} />
            <Text style={{textAlign: 'center', marginTop: 12}}>
              Uploading...
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.attachmentSheet,
              {backgroundColor: colors.background},
            ]}>
            <Text style={styles.attachTitle}>Upload Media</Text>
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
        )}
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
    padding: 16,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    minHeight: 200,
  },
  attachTitle: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  attachBtn: {
    paddingVertical: 12,
  },
  attachBtnText: {fontSize: 18},
});

export default AttachmentModal;
