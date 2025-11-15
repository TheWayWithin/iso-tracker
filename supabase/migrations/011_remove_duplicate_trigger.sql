-- Migration: 011_remove_duplicate_trigger.sql
-- Purpose: Fix signup by removing duplicate notification_preferences trigger
-- Date: 2025-01-12
-- Issue: Two triggers were both trying to create notification_preferences on signup
--   - Migration 007: on_user_created_notification_preferences
--   - Migration 009/010: on_auth_user_created (handles profile + subscription + notification_preferences)
-- Root Cause: Duplicate triggers caused UNIQUE constraint violation
-- Solution: Drop the old trigger from migration 007, keep the comprehensive one from 009/010

-- =====================================================
-- Drop the duplicate trigger from migration 007
-- =====================================================

DROP TRIGGER IF EXISTS on_user_created_notification_preferences ON auth.users;

-- =====================================================
-- Drop the old function (no longer needed)
-- =====================================================

DROP FUNCTION IF EXISTS public.create_notification_preferences();

-- =====================================================
-- Verify the correct trigger still exists
-- =====================================================

-- The on_auth_user_created trigger from migration 009/010 handles:
-- 1. Profile creation
-- 2. Subscription creation
-- 3. Notification preferences creation

COMMENT ON FUNCTION public.handle_new_user() IS
  'SINGLE SOURCE OF TRUTH for user signup. Creates profile, subscription, and notification_preferences. Migration 011 removed duplicate trigger.';
