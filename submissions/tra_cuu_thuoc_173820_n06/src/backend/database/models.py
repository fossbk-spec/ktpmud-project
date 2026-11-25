
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.database import Base


class ActiveIngredient(Base):
    __tablename__ = "active_ingredients"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # Quan hệ cũ: giữ lại để tương thích với code hiện tại.
    medicines = relationship(
        "Medicine",
        back_populates="active_ingredient",
    )

    # Quan hệ mới: hỗ trợ một hoạt chất thuộc nhiều thuốc,
    # và một thuốc có nhiều hoạt chất.
    medicine_ingredient_links = relationship(
        "MedicineIngredient",
        back_populates="active_ingredient",
        cascade="all, delete-orphan",
    )


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    name = Column(String, nullable=False, index=True)
    sdk_code = Column(String, nullable=True)
    strength = Column(String, nullable=True)
    dosage_form = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    indication = Column(Text, nullable=True)
    contraindication = Column(Text, nullable=True)
    side_effect = Column(Text, nullable=True)
    warning = Column(Text, nullable=True)

    # Quan hệ cũ: không xóa để tránh làm hỏng API hiện tại.
    active_ingredient_id = Column(
        Integer,
        ForeignKey("active_ingredients.id"),
        nullable=True,
    )

    active_ingredient = relationship(
        "ActiveIngredient",
        back_populates="medicines",
    )

    # Quan hệ mới: các hoạt chất được liên kết với thuốc.
    ingredient_links = relationship(
        "MedicineIngredient",
        back_populates="medicine",
        cascade="all, delete-orphan",
    )


class MedicineIngredient(Base):
    __tablename__ = "medicine_ingredients"

    medicine_id = Column(
        Integer,
        ForeignKey("medicines.id", ondelete="CASCADE"),
        primary_key=True,
    )
    active_ingredient_id = Column(
        Integer,
        ForeignKey("active_ingredients.id", ondelete="RESTRICT"),
        primary_key=True,
    )

    source = Column(
        String,
        nullable=False,
        default="manual_review",
    )
    review_status = Column(
        String,
        nullable=False,
        default="pending_review",
    )
    review_note = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    medicine = relationship(
        "Medicine",
        back_populates="ingredient_links",
    )
    active_ingredient = relationship(
        "ActiveIngredient",
        back_populates="medicine_ingredient_links",
    )


class SearchHistory(Base):
    __tablename__ = "search_histories"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=True)
    search_type = Column(String(50), nullable=False)
    result_summary = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class ImageProcessingHistory(Base):
    __tablename__ = "image_processing_histories"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    operation_type = Column(String(50), nullable=False)
    image_path = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    content_type = Column(String(100), nullable=True)
    detected_medicine_name = Column(String(255), nullable=True)
    result_text = Column(Text, nullable=True)
    result_summary = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="success")
    error_message = Column(Text, nullable=True)
    # Hồ sơ người dùng thuốc (để so sánh tương tác giữa các đơn của cùng một người).
    profile_id = Column(Integer, nullable=True, index=True)
    # Ngày kê đơn đọc được từ đơn (ISO yyyy-mm-dd) và mã băm ảnh (phát hiện quét trùng một đơn).
    prescription_date = Column(String(10), nullable=True)
    image_sha256 = Column(String(64), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Profile(Base):
    """Hồ sơ người dùng thuốc: nhóm các đơn thuốc của cùng một người."""

    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
