import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Notifications from 'expo-notifications';
 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
 
export default function App() {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [segundos, setSegundos] = useState('10');
  const [agendadas, setAgendadas] = useState([]);
 
  async function garantirPermissao() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('lembretes', {
        name: 'Lembretes',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
 
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
 
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  }
 
  async function carregarAgendamentos() {
    const lista = await Notifications.getAllScheduledNotificationsAsync();
    setAgendadas(lista);
  }
 
  useEffect(() => {
    garantirPermissao();
    carregarAgendamentos();
  }, []);
 
  async function salvarLembrete() {
    if (!titulo.trim() || !segundos.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o título e o tempo em segundos.');
      return;
    }
 
    const permitido = await garantirPermissao();
    if (!permitido) {
      Alert.alert('Permissão negada', 'Ative as notificações nas configurações para usar esta função.');
      return;
    }
 
    const tempoEmSegundos = Number(segundos);
    if (isNaN(tempoEmSegundos) || tempoEmSegundos <= 0) {
      Alert.alert('Erro', 'Informe um tempo válido em segundos.');
      return;
    }
 
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: mensagem,
          data: { origem: 'aula' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: tempoEmSegundos,
          channelId: 'lembretes',
        },
      });
 
      Alert.alert('Sucesso', `Lembrete agendado para daqui a ${tempoEmSegundos} segundos!`);
     
      setTitulo('');
      setMensagem('');
      setSegundos('10');
 
      await carregarAgendamentos();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível agendar o lembrete.');
      console.error(error);
    }
  }
 
  async function notificarAgora() {
    const permitido = await garantirPermissao();
    if (!permitido) return;
 
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo || 'Hora de estudar',
        body: mensagem || 'Revise o conteúdo de arrays.',
      },
      trigger: null,
    });
  }
 
  async function cancelar(id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    setAgendadas((lista) => lista.filter((item) => item.identifier !== id));
    Alert.alert('Cancelado', 'O lembrete foi removido.');
  }
 
  async function cancelarTudo() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setAgendadas([]);
    Alert.alert('Cancelado', 'Todos os lembretes foram removidos.');
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
     
      <Text style={styles.headerTitle}>Lembretes</Text>
 
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Título do lembrete (ex: Revisar arrays)"
          value={titulo}
          onChangeText={setTitulo}
        />
        <TextInput
          style={styles.input}
          placeholder="Mensagem (ex: A atividade começa em 10m)"
          value={mensagem}
          onChangeText={setMensagem}
        />
        <TextInput
          style={styles.input}
          placeholder="Tempo em segundos (ex: 10)"
          keyboardType="numeric"
          value={segundos}
          onChangeText={setSegundos}
        />
 
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={salvarLembrete}>
            <Text style={styles.btnText}>Agendar Lembrete</Text>
          </TouchableOpacity>
 
          <TouchableOpacity style={styles.btnSecondary} onPress={notificarAgora}>
            <Text style={styles.btnTextSecondary}>Notificar Agora</Text>
          </TouchableOpacity>
        </View>
      </View>
 
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Agendados ({agendadas.length})
          </Text>
          {agendadas.length > 0 && (
            <TouchableOpacity onPress={cancelarTudo}>
              <Text style={styles.clearAllText}>Cancelar todos</Text>
            </TouchableOpacity>
          )}
        </View>
 
        <FlatList
          data={agendadas}
          keyExtractor={(item) => item.identifier}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.content.title}</Text>
                <Text style={styles.cardBody}>{item.content.body}</Text>
              </View>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => cancelar(item.identifier)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum lembrete agendado.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 5,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnTextSecondary: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  clearAllText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  cardBody: {
    fontSize: 14,
    color: '#6C6C70',
    marginTop: 2,
  },
  btnCancel: {
    backgroundColor: '#FF3B3015',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnCancelText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 20,
    fontSize: 14,
  },
});