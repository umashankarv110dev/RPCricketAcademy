import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  Equipment,
  EquipmentSummary,
  addEquipment,
  getEquipmentList,
  getEquipmentSummary,
} from "../../src/database/repositories/equipmentRepository";
import { LinearGradient } from "expo-linear-gradient";

export default function EquipmentScreen() {
  const db = SQLite.useSQLiteContext();

  const [equipment, setEquipment] =
    useState<Equipment[]>([]);

  const [summary, setSummary] =
    useState<EquipmentSummary>({
      total_items: 0,
      available_items: 0,
      issued_items: 0,
      damaged_items: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [addModalVisible, setAddModalVisible] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [name, setName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [purchasePrice, setPurchasePrice] =
    useState("");

  const [location, setLocation] =
    useState("");

  const loadEquipment = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          equipmentData,
          summaryData,
        ] = await Promise.all([
          getEquipmentList(db),
          getEquipmentSummary(db),
        ]);

        setEquipment(
          equipmentData
        );

        setSummary(
          summaryData
        );
      } catch (error) {
        console.error(
          "Equipment loading error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load equipment."
        );
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      loadEquipment();
    }, [loadEquipment])
  );

  async function handleAddEquipment() {
    const parsedQuantity =
      Number(quantity);

    const parsedPrice =
      Number(purchasePrice || 0);

    if (!name.trim()) {
      Alert.alert(
        "Required",
        "Please enter equipment name."
      );
      return;
    }

    if (
      !parsedQuantity ||
      parsedQuantity <= 0
    ) {
      Alert.alert(
        "Invalid Quantity",
        "Please enter a valid quantity."
      );
      return;
    }

    try {
      setSaving(true);

      await addEquipment(db, {
        name,
        category,
        brand,
        quantity: parsedQuantity,
        purchasePrice:
          parsedPrice,
        location,
      });

      setName("");
      setCategory("");
      setBrand("");
      setQuantity("");
      setPurchasePrice("");
      setLocation("");

      setAddModalVisible(false);

      await loadEquipment();

      Alert.alert(
        "Equipment Added",
        "Equipment has been added successfully."
      );
    } catch (error) {
      console.error(
        "Add equipment error:",
        error
      );

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to add equipment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={Colors.white}
            />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Equipment</Text>
            <Text style={styles.headerSubtitle}>Manage academy cricket equipment</Text>
            {/* <Text style={styles.headerSubtitle}> Coach information & academy details </Text> */}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              setAddModalVisible(true)
            }
          >
            <Ionicons
              name="add"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
          
        </View>
      </LinearGradient>

      {/* SUMMARY */}

      <View style={styles.summaryRow}>
        <SummaryCard
          label="Total"
          value={summary.total_items}
          icon="cube-outline"
        />

        <SummaryCard
          label="Available"
          value={summary.available_items}
          icon="checkmark-circle-outline"
        />

        <SummaryCard
          label="Issued"
          value={summary.issued_items}
          icon="person-outline"
        />

        <SummaryCard
          label="Damaged"
          value={summary.damaged_items}
          icon="warning-outline"
        />
      </View>

      {/* LIST */}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading equipment...
          </Text>
        </View>
      ) : (
        <FlatList
          data={equipment}
          keyExtractor={(item) =>
            item.id.toString()
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.list
          }
          renderItem={({ item }) => (
            <EquipmentCard
              item={item}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="baseball-outline"
                  size={40}
                  color={Colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Equipment
              </Text>

              <Text style={styles.emptyText}>
                Add bats, balls, stumps,
                cones and other cricket
                equipment.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() =>
                  setAddModalVisible(
                    true
                  )
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={Colors.white}
                />

                <Text
                  style={styles.emptyButtonText}
                >
                  Add Equipment
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <AddEquipmentModal
        visible={addModalVisible}
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        brand={brand}
        setBrand={setBrand}
        quantity={quantity}
        setQuantity={setQuantity}
        purchasePrice={purchasePrice}
        setPurchasePrice={
          setPurchasePrice
        }
        location={location}
        setLocation={setLocation}
        saving={saving}
        onClose={() =>
          setAddModalVisible(false)
        }
        onSave={
          handleAddEquipment
        }
      />
    </View>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons
        name={icon}
        size={17}
        color={Colors.primary}
      />

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function EquipmentCard({
  item,
}: {
  item: Equipment;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
        pathname: "/equipment/[id]",
        params: {
            id: item.id.toString(),
        },
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={styles.equipmentIcon}>
          <Ionicons
            name="baseball-outline"
            size={23}
            color={Colors.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>
            {item.name}
          </Text>

          <Text style={styles.meta}>
            {item.category ||
              "Cricket Equipment"}
            {item.brand
              ? ` • ${item.brand}`
              : ""}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.textLight}
        />
      </View>

      <View style={styles.stockRow}>
        <StockItem
          label="Total"
          value={
            item.total_quantity
          }
        />

        <StockItem
          label="Available"
          value={
            item.available_quantity
          }
          positive
        />

        <StockItem
          label="Issued"
          value={
            item.issued_quantity
          }
        />

        <StockItem
          label="Damaged"
          value={
            item.damaged_quantity
          }
          negative={
            item.damaged_quantity >
            0
          }
        />
      </View>
    </TouchableOpacity>
  );
}

function StockItem({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={styles.stockItem}>
      <Text style={styles.stockLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.stockValue,
          positive &&
            styles.stockPositive,
          negative &&
            styles.stockNegative,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function AddEquipmentModal({
  visible,
  name,
  setName,
  category,
  setCategory,
  brand,
  setBrand,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  location,
  setLocation,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;

  name: string;
  setName: (value: string) => void;

  category: string;
  setCategory: (value: string) => void;

  brand: string;
  setBrand: (value: string) => void;

  quantity: string;
  setQuantity: (value: string) => void;

  purchasePrice: string;
  setPurchasePrice: (
    value: string
  ) => void;

  location: string;
  setLocation: (value: string) => void;

  saving: boolean;

  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Add Equipment
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  Add new academy stock
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <Input
              label="Equipment Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Cricket Bat"
            />

            <Input
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Batting"
            />

            <Input
              label="Brand"
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. SG"
            />

            <Input
              label="Quantity *"
              value={quantity}
              onChangeText={(value) =>
                setQuantity(
                  value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              }
              placeholder="e.g. 10"
              keyboardType="number-pad"
            />

            <Input
              label="Purchase Price"
              value={purchasePrice}
              onChangeText={(value) =>
                setPurchasePrice(
                  value.replace(
                    /[^0-9.]/g,
                    ""
                  )
                )
              }
              placeholder="e.g. 2500"
              keyboardType="decimal-pad"
            />

            <Input
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Academy Store"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color={Colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={19}
                    color={Colors.white}
                  />

                  <Text
                    style={styles.saveText}
                  >
                    Add Equipment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad";
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          Colors.textLight
        }
        keyboardType={
          keyboardType ?? "default"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 58 : 42,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    marginTop: 3,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 7,
    margin: 13,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 13,
    alignItems: "center",
    paddingVertical: 10,
  },

  summaryValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },

  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },

  list: {
    marginLeft:15,
    marginRight:15,
    paddingBottom: 30,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
    marginLeft: 11,
  },

  name: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  meta: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  stockRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    marginTop: 13,
    paddingTop: 12,
  },

  stockItem: {
    flex: 1,
    alignItems: "center",
  },

  stockLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
  },

  stockValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },

  stockPositive: {
    color: Colors.success,
  },

  stockNegative: {
    color: Colors.danger,
  },

  empty: {
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
  },

  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },

  emptyButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 18,
  },

  emptyButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  inputLabel: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 49,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 13,
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
  },

  saveText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 7,
  },
});