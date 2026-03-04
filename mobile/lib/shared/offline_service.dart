import 'package:hive_flutter/hive_flutter.dart';

class OfflineService {
  static Future<void> savePatientLocally(dynamic patient) async {
    final box = await Hive.openBox('patients');
    await box.put(patient['id'], patient);
  }

  static Future<List<dynamic>> getPatientsLocally() async {
    final box = await Hive.openBox('patients');
    return box.values.toList();
  }

  static Future<void> addPendingAction(String type, Map<String, dynamic> data) async {
    final box = await Hive.openBox('sync_queue');
    await box.add({
      'type': type,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }
}
